// Bokeh plot configuration
var xdr = new Bokeh.Range1d({ start: 1E-6, end: 0.1 });
var ydr = new Bokeh.Range1d({ start: 0, end: 1 });

// Create the plot with tools
var plot = Bokeh.Plotting.figure({
    x_range: xdr,
    x_axis_type: "log",
    y_range: ydr,
    tools: "pan,wheel_zoom,box_zoom,reset,save",
    x_axis_label: 'Breeding time [s]',
    y_axis_label: 'Charge state abundance',
    sizing_mode: 'stretch_both',
});

// Data variables
var data_from_API = [];
var labels;
var ch_state_number;
var i;

// Bokeh Category20_20 palette
var palette = [
    '#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78', '#2ca02c', 
    '#98df8a', '#d62728', '#ff9896', '#9467bd', '#c5b0d5', 
    '#8c564b', '#c49c94', '#e377c2', '#f7b6d2', '#7f7f7f', 
    '#c7c7c7', '#bcbd22', '#dbdb8d', '#17becf', '#9edae5'
];

// Store current visibility state for legend items
var lineVisibility = {};

/**
 * Query the backend API with user input parameters
 */
function getData(callback) {
    // Build API URL with parameters
    var address_string = "https://q0oo54zo2c.execute-api.eu-central-1.amazonaws.com/dev?element=" + 
        document.getElementById("elementSelector").value +
        "&energy=" + document.getElementById("energySelector").value +
        "&density=" + document.getElementById("densitySelector").value +
        '&minlogtime=' + document.getElementById("minLogTime").value +
        '&maxlogtime=' + document.getElementById("maxLogTime").value +
        '&rest_gas_pressure=' + document.getElementById("restGasPressure").value +
        '&rest_gas_ip=' + document.getElementById("restGasIP").value +
        '&injection=' + document.getElementById("injectionSelector").value;
    
    // Show loading overlay on plot container
    $("#loadingMessage").html(
        '<div class="loading-overlay">' +
            '<img src="./giphy.gif" alt="Loading..." class="loading-gif">' +
            '<div class="loading-text">Calculating charge breeding evolution...</div>' +
        '</div>'
    ).show();
    
    // Make AJAX request (ASYNC - non-blocking)
    $.ajax({
        url: address_string,
        headers: { 
            'Access-Control-Allow-Origin': '*', 
            'Access-Control-Allow-Headers': 'Access-Control-Allow-Origin' 
        },
        async: true,
        success: function (result) {
            // Process API response
            data_from_API = [];
            console.log('API Response:', result);
            
            for (i = 0; i < result.number_of_ch_states; i++) {
                data_from_API.push(result[i + '+']);
            }
            
            ch_state_number = result.number_of_ch_states;
            labels = result.labels;
            
            // Create Bokeh data source
            var data_source_from_call = new Bokeh.ColumnDataSource({
                data: { x: [] }
            });

            data_source_from_call.data.x = labels;

            for (i = 0; i < ch_state_number; i++) {
                data_source_from_call.data[i] = data_from_API[i];
            }
            
            // Clear loading message
            $("#loadingMessage").html("").hide();
            
            // Call the callback with the data
            if (callback) {
                callback(data_source_from_call);
            }
        },
        error: function (err) {
            console.error('API Error:', err);
            $("#loadingMessage").html(
                '<div class="error-overlay">' +
                    '<div class="error-icon">⚠️</div>' +
                    '<div class="error-text">Error communicating with API</div>' +
                    '<div class="error-hint">Please check your parameters and try again.</div>' +
                '</div>'
            ).show();
        }
    });
}

/**
 * Create a 5-column HTML legend on the right side of the plot
 */
function createThreeColumnLegend(plotRenderers, palette, ch_state_number) {
    // Create or get legend container
    var legendContainer = document.getElementById('customLegendContainer');
    if (!legendContainer) {
        legendContainer = document.createElement('div');
        legendContainer.id = 'customLegendContainer';
        legendContainer.style.cssText = `
            position: absolute;
            top: 30px;
            right: 30px;
            padding: 12px 12px 6px 12px; 
            background-color: transparent;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            max-height: calc(100% - 100px);
            overflow-y: auto;
            z-index: 1000;
            
        `;
        
        // Insert into plot container
        var plotContainer = document.getElementById('plotContainer');
        plotContainer.style.position = 'relative';
        plotContainer.appendChild(legendContainer);
    }
    
    // Clear existing content
    legendContainer.innerHTML = '';
    
    // Calculate items per column (divide by 5)
    var itemsPerColumn = Math.ceil(ch_state_number / 5);
    
    // Create title with buttons in the same row
    var titleHtml = `
        <div style="display: flex; 
                    justify-content: space-between; 
                    align-items: center;
                    margin-bottom: 2px; 
                    padding-bottom: 2px;
                    border-bottom: 1px solid #e2e8f0;
                    gap: 15px;">
            <div style="font-weight: bold; 
                        font-size: 9pt; 
                        color: #2d3748;
                        line-height: 1;">
                Charge States 
            </div>
            <div class="legend-controls" style="margin: 0; display: flex; gap: 4px;">
                <button class="legend-button" style="padding: 2px 8px; font-size: 8pt; line-height: 1.2; white-space: nowrap;" onclick="showAllLines()">Show All</button>
            </div>
        </div>
    `;
    
    // Create 5 columns
    var columnsHtml = '';
    for (var col = 0; col < 5; col++) {
        var startIdx = col * itemsPerColumn;
        var endIdx = Math.min(startIdx + itemsPerColumn, ch_state_number);
        
        if (startIdx >= endIdx) continue;
        
        columnsHtml += `
            <div style="flex: 1; min-width: 60px; padding: 0 2px;">
                ${createColumnItems(startIdx, endIdx, plotRenderers, palette)}
            </div>
        `;
    }
    
    // Set container HTML with flex layout (buttons removed from bottom)
    legendContainer.innerHTML = titleHtml + `
        <div style="display: flex; gap: 4px;">
            ${columnsHtml}
        </div>
    `;
    
    // Add legend item styles
    addLegendStyles();
}

/**
 * Create HTML for a column of legend items
 */
function createColumnItems(startIdx, endIdx, plotRenderers, palette) {
    var itemsHtml = '';
    
    for (var i = startIdx; i < endIdx; i++) {
        var isVisible = lineVisibility[i] !== undefined ? lineVisibility[i] : true;
        var opacity = isVisible ? '1.0' : '0.3';
        var textDecoration = isVisible ? 'none' : 'line-through';
        
        itemsHtml += `
            <div class="legend-item" 
                 data-index="${i}"
                 style="display: flex; 
                        align-items: center; 
                        margin-bottom: 4px; 
                        cursor: pointer;
                        padding: 3px 3px;
                        border-radius: 3px;
                        transition: background-color 0.2s;"
                 onclick="toggleLineVisibility(${i})"
                 onmouseover="this.style.backgroundColor='#f7fafc'"
                 onmouseout="this.style.backgroundColor='transparent'">
                <div style="width: 12px; 
                           height: 12px; 
                           background-color: ${palette[i % palette.length]}; 
                           margin-right: 8px; 
                           border-radius: 2px;
                           opacity: ${opacity};
                           border: 1px solid #cbd5e0;
                           flex-shrink: 0;"></div>
                <span style="font-size: 8pt; 
                            opacity: ${opacity};
                            text-decoration: ${textDecoration};
                            color: #2d3748;
                            white-space: nowrap;">
                    ${i}+
                </span>
            </div>
        `;
    }
    
    return itemsHtml;
}

/**
 * Add CSS styles for legend items
 */
function addLegendStyles() {
    // Remove existing style if present
    var existingStyle = document.getElementById('legend-styles');
    if (existingStyle) existingStyle.remove();
    
    var style = document.createElement('style');
    style.id = 'legend-styles';
    style.textContent = `
        .legend-item.active {
            background-color: #edf2f7;
        }
        .legend-item:hover {
            background-color: #e2e8f0 !important;
        }
        .legend-controls {
            display: flex;
            gap: 8px;
            justify-content: center;
        }
        .legend-button {
            padding: 2px 2px;
            font-size: 8pt;
            border: 1px solid #cbd5e0;
            background-color: #f7fafc;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.2s;
            flex: 1;
        }
        .legend-button:hover {
            background-color: #e2e8f0;
            border-color: #a0aec0;
        }
        #customLegendContainer::-webkit-scrollbar {
            width: 6px;
        }
        #customLegendContainer::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
        }
        #customLegendContainer::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 3px;
        }
        #customLegendContainer::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Toggle visibility of a line when legend item is clicked
 */
function toggleLineVisibility(index) {
    if (plot.renderers[index]) {
        var isVisible = plot.renderers[index].visible;
        plot.renderers[index].visible = !isVisible;
        lineVisibility[index] = !isVisible;
        
        // Update the legend item appearance
        var legendItem = document.querySelector(`.legend-item[data-index="${index}"]`);
        if (legendItem) {
            var colorBox = legendItem.querySelector('div');
            var textSpan = legendItem.querySelector('span');
            
            if (!isVisible) {
                colorBox.style.opacity = '1.0';
                textSpan.style.opacity = '1.0';
                textSpan.style.textDecoration = 'none';
            } else {
                colorBox.style.opacity = '0.3';
                textSpan.style.opacity = '0.3';
                textSpan.style.textDecoration = 'line-through';
            }
        }
        
        // Trigger plot update
        plot.change.emit();
    }
}

/**
 * Show all lines
 */
function showAllLines() {
    for (var i = 0; i < plot.renderers.length; i++) {
        if (plot.renderers[i]) {
            plot.renderers[i].visible = true;
            lineVisibility[i] = true;
        }
    }
    updateLegendAppearance();
    plot.change.emit();
}

/**
 * Hide all lines
 */
function hideAllLines() {
    for (var i = 0; i < plot.renderers.length; i++) {
        if (plot.renderers[i]) {
            plot.renderers[i].visible = false;
            lineVisibility[i] = false;
        }
    }
    updateLegendAppearance();
    plot.change.emit();
}

/**
 * Update legend appearance based on current visibility
 */
function updateLegendAppearance() {
    var legendItems = document.querySelectorAll('.legend-item');
    legendItems.forEach(function(item) {
        var index = parseInt(item.getAttribute('data-index'));
        var isVisible = lineVisibility[index] !== undefined ? lineVisibility[index] : true;
        var colorBox = item.querySelector('div');
        var textSpan = item.querySelector('span');
        
        if (isVisible) {
            colorBox.style.opacity = '1.0';
            textSpan.style.opacity = '1.0';
            textSpan.style.textDecoration = 'none';
        } else {
            colorBox.style.opacity = '0.3';
            textSpan.style.opacity = '0.3';
            textSpan.style.textDecoration = 'line-through';
        }
    });
}

/**
 * Update the plot with new data
 */
function updatePlot() {
    // Update plot title
    plot.title.text = 'Charge state evolution of ' + 
        document.getElementById("elementSelector").value + 
        ' under flow of ' + 
        document.getElementById("energySelector").value + 
        ' eV electrons at ' + 
        document.getElementById("densitySelector").value + 
        ' A/cm² current density';
    
    // Get new data from API (async with callback)
    getData(function(source) {
        // This code runs AFTER data arrives
        
        // Clear previous plot renderers
        if (plot.renderers.length > 0) {
            plot.renderers = [];
        }
        
        // Reset line visibility
        lineVisibility = {};
        
        // Update x-axis range
        xdr.start = parseFloat('1E' + document.getElementById("minLogTime").value);
        xdr.end = parseFloat('1E' + document.getElementById("maxLogTime").value);
        
        // Plot new lines
        for (i = 0; i < ch_state_number; i++) {
            var line = plot.line({ field: "x" }, { field: i }, {
                source: source,
                line_width: 2,
                line_color: palette[i % palette.length],
                name: i + '+'
            });
            lineVisibility[i] = true; // All lines visible by default
        }
        
        // Create the 3-column HTML legend on the right
        createThreeColumnLegend(plot.renderers, palette, ch_state_number);
    });
}

// Initial plot update on page load
updatePlot();

// Render the plot
try {
    Bokeh.Plotting.show(plot, document.getElementById('plotContainer'));
    // Hide loading message after initial plot render
    $("#loadingMessage").hide();
} catch (e) {
    console.error('Plot rendering error:', e);
    $("#loadingMessage").html(
        '<div class="error-overlay">' +
            '<div class="error-icon">⚠️</div>' +
            '<div class="error-text">Error while rendering plot</div>' +
        '</div>'
    ).show();
}

// Attach event listener to Calculate button
document.getElementById('calculateBtn').addEventListener('click', updatePlot);

// Make functions available globally for onclick handlers
window.toggleLineVisibility = toggleLineVisibility;
window.showAllLines = showAllLines;
window.hideAllLines = hideAllLines;

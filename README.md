# PyCB Charge Breeding Simulator - Modern Frontend

A modernized static web application for simulating charge breeding processes under electron flux.

## Features

- ✨ Modern, clean UI design with gradient headers and card-based layout
- 📊 Interactive Bokeh plots for visualizing charge state evolution
- 🎨 Responsive design that works on all devices
- ⚡ Fast and lightweight - no server required
- 🔧 Easy to deploy to AWS S3 or any static hosting

## What's New

### Design Improvements
- Modern gradient header with professional styling
- Card-based parameter input sections with hover effects
- Improved typography using Inter font family
- Better color scheme with CSS variables for easy customization
- Responsive grid layout that adapts to different screen sizes
- Enhanced form controls with better UX
- Smooth transitions and animations

### Technical Improvements
- Updated to modern CSS (CSS Grid, Flexbox)
- Cleaner, more maintainable code structure
- Better error handling and user feedback
- Improved loading states with visual feedback
- Optimized for performance

## Files Included

- `index.html` - Main HTML file with modernized structure
- `style.css` - Modern CSS with variables, grid layout, and animations
- `bokeh_plot.js` - Updated JavaScript (maintains original backend logic)
- `giphy.gif` - Loading animation

## Backend Integration

The frontend connects to the AWS Lambda API endpoint:
```
https://q0oo54zo2c.execute-api.eu-central-1.amazonaws.com/dev
```

No changes were made to the backend communication logic. The application sends the same parameters:
- element
- energy
- density
- minlogtime
- maxlogtime
- rest_gas_pressure
- rest_gas_ip
- injection

## Deployment to AWS S3

### 1. Create an S3 Bucket

```bash
aws s3 mb s3://your-pycb-bucket-name
```

### 2. Enable Static Website Hosting

```bash
aws s3 website s3://your-pycb-bucket-name \
  --index-document index.html \
  --error-document index.html
```

### 3. Set Bucket Policy for Public Access

Create a file named `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-pycb-bucket-name/*"
    }
  ]
}
```

Apply the policy:

```bash
aws s3api put-bucket-policy \
  --bucket your-pycb-bucket-name \
  --policy file://bucket-policy.json
```

### 4. Upload Files

```bash
# Upload all files
aws s3 sync . s3://your-pycb-bucket-name \
  --exclude "*.zip" \
  --exclude "README.md" \
  --exclude "bucket-policy.json"

# Set correct content types
aws s3 cp s3://your-pycb-bucket-name/index.html \
  s3://your-pycb-bucket-name/index.html \
  --content-type "text/html" \
  --metadata-directive REPLACE

aws s3 cp s3://your-pycb-bucket-name/style.css \
  s3://your-pycb-bucket-name/style.css \
  --content-type "text/css" \
  --metadata-directive REPLACE

aws s3 cp s3://your-pycb-bucket-name/bokeh_plot.js \
  s3://your-pycb-bucket-name/bokeh_plot.js \
  --content-type "application/javascript" \
  --metadata-directive REPLACE
```

### 5. Access Your Site

Your site will be available at:
```
http://your-pycb-bucket-name.s3-website-[region].amazonaws.com
```

Or get the URL with:
```bash
aws s3api get-bucket-website --bucket your-pycb-bucket-name
```

## Alternative: Deploy with AWS CLI in One Command

```bash
# Set variables
BUCKET_NAME="your-pycb-bucket-name"
REGION="us-east-1"  # Change to your preferred region

# Create bucket
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable website hosting
aws s3 website s3://$BUCKET_NAME --index-document index.html

# Upload files with public-read ACL (if ACLs are enabled)
aws s3 sync . s3://$BUCKET_NAME --acl public-read \
  --exclude "*.zip" --exclude "README.md" --exclude "*.json"

# Or use bucket policy for public access (recommended)
# Apply the bucket policy as shown above
```

## CloudFront (Optional)

For better performance and HTTPS, you can add CloudFront:

1. Create a CloudFront distribution pointing to your S3 bucket
2. Configure custom domain (optional)
3. Enable HTTPS with ACM certificate

## Customization

### Colors
Edit CSS variables in `style.css`:
```css
:root {
    --primary-color: #3b82f6;  /* Change primary color */
    --header-bg: linear-gradient(...);  /* Change header gradient */
    /* ... more variables ... */
}
```

### Fonts
Change the font family in the `<head>` section of `index.html` and update the CSS.

### Layout
Modify the grid layout in `.control-panel` class in `style.css`.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## Dependencies

All dependencies are loaded from CDN:
- Bokeh 2.2.3 (plotting library)
- jQuery 3.6.0 (for AJAX requests)
- Google Fonts - Inter (typography)

## License

Original PyCB backend and logic maintained. Frontend modernization enhancements included.

## Support

For issues related to:
- **Frontend/UI**: Check browser console for errors
- **Backend/API**: Verify AWS Lambda endpoint is accessible
- **Deployment**: Ensure S3 bucket policy allows public read access

---

**Note**: This is a static frontend that requires no server. All computation is handled by the AWS Lambda backend.

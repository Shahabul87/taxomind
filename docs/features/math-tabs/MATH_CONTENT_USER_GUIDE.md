# Math Content Management - User Guide

## 🎯 Overview

The new Math Content interface provides an intuitive way to add, manage, and display mathematical explanations within your course sections. This guide will help you make the most of the enhanced features.

## 📍 Accessing Math Content

1. Navigate to your course: **Teacher → Courses → [Your Course]**
2. Select a chapter and then a section
3. Click on the **"Math"** tab at the top of the section page
4. You'll see all existing math content and the option to add new items

## ✨ Key Features

### 1. Unified Content Creation
- **Single Form Interface**: No need to switch between different modes
- **Flexible Input**: Choose between LaTeX equations OR uploaded images
- **Rich Text Explanations**: Format your explanations with markdown and inline LaTeX

### 2. Live Preview
- **Real-time LaTeX Rendering**: See your equations as you type them
- **Instant Feedback**: Validate your LaTeX syntax before submitting

### 3. Professional Display
- **Two-Column Layout**: Equations on the left, explanations on the right
- **Responsive Design**: Works beautifully on desktop, tablet, and mobile
- **Elegant Cards**: Each math item is presented in a clean, professional card

## 📝 Adding Math Content

### Step 1: Click "Add Math Content"
Click the **"Add Math Content"** button in the top-right corner of the Math tab.

### Step 2: Fill in the Title
Enter a descriptive title for your math content (minimum 3 characters).

**Example**: "Pythagorean Theorem", "Quadratic Formula Derivation"

### Step 3: Add Your Equation

You have two options:

#### Option A: LaTeX Equation

1. Click in the **LaTeX Equation** field
2. Enter your equation using LaTeX syntax
3. Watch the **live preview** appear below

**Common LaTeX Examples**:

```latex
# Basic equation
x^2 + y^2 = r^2

# Fractions
\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}

# Integrals
\int_{0}^{\infty} e^{-x^2} dx = \frac{\sqrt{\pi}}{2}

# Matrices
\begin{bmatrix}
a & b \\
c & d
\end{bmatrix}

# Greek letters
\alpha, \beta, \gamma, \Delta, \Sigma

# Summation
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
```

#### Option B: Upload Image

1. Click **"Upload an image"** or drag-and-drop an image file
2. Supported formats: PNG, JPG, JPEG, GIF
3. Preview appears after upload
4. Click the **X button** to remove and upload a different image

**Best for**: Hand-drawn diagrams, complex mathematical figures, screenshots from textbooks

### Step 4: Write Your Explanation

Use the **Rich Text Editor** to write a detailed explanation:

#### Toolbar Buttons:
- **Bold** (`**text**`): Makes text bold
- **Italic** (`*text*`): Makes text italic
- **Code** (`` `text` ``): Formats as inline code
- **$...$ Button**: Wraps selected text in LaTeX delimiters for inline math
- **List**: Adds bullet point (`-`)

#### Inline LaTeX:
You can include inline math expressions in your explanation:

```markdown
The formula $E = mc^2$ shows the relationship between energy and mass.

For a circle with radius $r$, the area is $A = \pi r^2$.
```

#### Markdown Formatting:
```markdown
**Important**: This is bold text.
*Note*: This is italic text.

- First point
- Second point
- Third point

Use `variables` for code or variable names.
```

### Step 5: Submit
Click **"Submit"** to add the math content. You'll see:
- A success message
- Your new content appears in the list
- The form automatically closes

## ✏️ Editing Math Content

1. Find the math content card you want to edit
2. Click the **Edit** button (pencil icon) in the top-right of the card
3. The form opens with all existing data pre-filled
4. Make your changes
5. Click **"Submit"** to save

**Note**: Currently, only title, equation/image, and explanation can be edited. Editing functionality will be fully implemented soon.

## 🗑️ Deleting Math Content

1. Find the math content card you want to remove
2. Click the **Delete** button (trash icon) in the top-right of the card
3. Confirm the deletion
4. The card disappears with a success message

**Warning**: Deletion is permanent and cannot be undone!

## 💡 Best Practices

### For Equations:
1. **Test Your LaTeX**: Use the live preview to verify syntax before submitting
2. **Keep It Clear**: Break complex equations into multiple steps
3. **Use Descriptive Titles**: "Quadratic Formula" vs "Formula #3"

### For Explanations:
1. **Start with Context**: Explain what the equation represents
2. **Define Variables**: List what each variable means
3. **Show Applications**: Include real-world examples when relevant
4. **Use Formatting**: Bold key concepts, use lists for steps

### For Images:
1. **High Quality**: Use clear, high-resolution images
2. **Good Lighting**: Ensure handwritten content is legible
3. **Crop Appropriately**: Remove unnecessary whitespace
4. **Annotate**: Add labels or arrows to complex diagrams

## 🎨 LaTeX Quick Reference

### Common Symbols:
| Symbol | LaTeX | Symbol | LaTeX |
|--------|-------|--------|-------|
| α | `\alpha` | β | `\beta` |
| θ | `\theta` | Σ | `\Sigma` |
| ∞ | `\infty` | ≈ | `\approx` |
| ≤ | `\leq` | ≥ | `\geq` |
| ± | `\pm` | × | `\times` |
| ÷ | `\div` | ≠ | `\neq` |

### Operations:
| Operation | LaTeX |
|-----------|-------|
| Fraction | `\frac{numerator}{denominator}` |
| Square root | `\sqrt{x}` |
| N-th root | `\sqrt[n]{x}` |
| Superscript | `x^{2}` |
| Subscript | `x_{i}` |
| Summation | `\sum_{i=1}^{n} x_i` |
| Integral | `\int_{a}^{b} f(x) dx` |

### Delimiters:
| Delimiter | LaTeX |
|-----------|-------|
| Parentheses | `\left( ... \right)` |
| Brackets | `\left[ ... \right]` |
| Braces | `\left\{ ... \right\}` |
| Absolute value | `\left| ... \right|` |

## 🔧 Troubleshooting

### Issue: LaTeX Doesn't Render
**Solution**:
- Check for syntax errors (missing braces, backslashes)
- Ensure special characters are escaped
- Try wrapping complex expressions in `\left( ... \right)`

### Issue: Image Upload Fails
**Solution**:
- Check file size (max 10MB)
- Ensure file format is PNG, JPG, JPEG, or GIF
- Try compressing the image
- Check your internet connection

### Issue: Changes Not Saving
**Solution**:
- Ensure all required fields are filled
- Check for validation error messages
- Try refreshing the page and submitting again
- Contact support if issue persists

### Issue: Can't See Math Tab
**Solution**:
- Ensure you're on a section page (not chapter page)
- Check that you have teacher permissions
- Refresh the page
- Clear browser cache

## 🚀 Pro Tips

1. **Batch Creation**: Prepare all your equations in a document first, then add them one by one
2. **Use Templates**: Create a standard format for similar types of content
3. **Preview Often**: Use the live preview to catch errors early
4. **Mobile Check**: View your content on mobile to ensure readability
5. **Backup Important Equations**: Save complex LaTeX in a separate document

## 📱 Mobile Usage

The interface is fully responsive:
- **Cards stack vertically** on smaller screens
- **Touch-friendly buttons** for easy navigation
- **Swipe to scroll** through long equations
- **Zoom friendly** for detailed viewing

## 🆘 Getting Help

If you encounter issues:
1. Check this guide first
2. Review the troubleshooting section
3. Contact technical support with:
   - Screenshot of the issue
   - Steps to reproduce
   - Browser and device information

## 📊 Updates and Improvements

This is the **new version** of the Math Content interface. Key improvements:

✅ Simpler single-form interface
✅ Live LaTeX preview
✅ Better image upload experience
✅ Rich text editor with formatting
✅ Responsive mobile design
✅ Faster loading with skeleton screens
✅ Better error handling

---

**Version**: 2.0
**Last Updated**: January 2025
**Status**: Active

For questions or feedback, contact the development team.

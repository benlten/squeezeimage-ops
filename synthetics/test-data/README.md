# Test Data Files

This directory contains test files for file size limit testing.

## Files:
- `small-test.txt` - Small file (~100 bytes) for basic upload tests
- Add larger test images as needed for comprehensive testing

## Usage:
These files are used by the file size limit tests to verify:
- Anonymous user upload limits
- Admin user unlimited access
- Server-side file size enforcement

## Adding Test Images:
To add actual image test files:
```bash
# Small image (< 1MB)
curl -o synthetics/test-data/small-image.jpg "https://via.placeholder.com/800x600.jpg"

# Medium image (~5MB) - would need actual file
# Large image (~15MB) - would need actual file
```

Note: Actual large test files are not included in the repository to keep it lightweight.
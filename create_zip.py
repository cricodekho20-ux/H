import os
import zipfile

output_zip = 'public/editpro-app.zip'
os.makedirs('public', exist_ok=True)

# Exclude directories
EXCLUDE_DIRS = {'node_modules', '.git', 'dist', '.cache', '__pycache__', '.temp'}
EXCLUDE_FILES = {'editpro-app.zip', 'create_zip.py'}

print(f"Creating {output_zip}...")

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Modify dirs in-place to skip excluded directories
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith('.')]
        
        for file in files:
            if file in EXCLUDE_FILES:
                continue
            if file.endswith('.pyc') or file.startswith('.'):
                continue
                
            filepath = os.path.join(root, file)
            # relative path for archive
            arcname = os.path.relpath(filepath, '.')
            
            # Skip if inside public/ and is the zip itself
            if arcname == 'public/editpro-app.zip':
                continue
                
            print(f"Adding: {arcname}")
            zipf.write(filepath, arcname)

size_mb = os.path.getsize(output_zip) / (1024 * 1024)
print(f"Successfully generated {output_zip} ({size_mb:.2f} MB)")

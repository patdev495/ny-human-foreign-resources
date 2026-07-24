import os
import sys

MAX_LINES = 400
IGNORE_DIRS = {
    '.git', '.venv', 'node_modules', '__pycache__', '.pytest_cache',
    '.gemini', 'dist', 'build', '.scratch', 'coverage'
}
TARGET_EXTENSIONS = ('.py', '.ts', '.tsx')

def check_file_lengths(root_dir='.'):
    exceeding_files = []
    
    for root, dirs, files in os.walk(root_dir):
        # Skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            if file.endswith(TARGET_EXTENSIONS):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        line_count = len(f.readlines())
                        if line_count > MAX_LINES:
                            exceeding_files.append((line_count, filepath))
                except Exception as e:
                    print(f"Warning: Could not read file {filepath}: {e}", file=sys.stderr)
                    
    if exceeding_files:
        exceeding_files.sort(reverse=True)
        print(f"\n[FAIL] Found {len(exceeding_files)} file(s) exceeding {MAX_LINES} lines limit:")
        for count, path in exceeding_files:
            print(f"  - {path}: {count} lines")
        return False
    else:
        print(f"\n[PASS] All source files are within {MAX_LINES} lines limit!")
        return True

if __name__ == '__main__':
    success = check_file_lengths()
    if not success:
        sys.exit(1)

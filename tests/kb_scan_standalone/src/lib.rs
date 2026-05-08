// Minimal test file for kb_scan parsing functions
// No dependencies on tauri/tokio to avoid webkit/soup dependencies

use std::fs;
use std::path::Path;

#[derive(Debug)]
struct KBFileInfo {
    path: String,
    name: String,
    size: u64,
    is_markdown: bool,
}

fn scan_directory_recursive(dir: &Path, files: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_dir() {
            scan_directory_recursive(&path, files)?;
        } else {
            let file_path = path.to_string_lossy().to_string();

            if file_path.ends_with(".md") || file_path.ends_with(".markdown") {
                files.push(file_path);
            }
        }
    }

    Ok(())
}

fn get_file_info_minimal(file_path: &str) -> Result<KBFileInfo, String> {
    let path = Path::new(file_path);

    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }

    let metadata = fs::metadata(path).map_err(|e| format!("Failed to get file metadata: {}", e))?;

    let name = path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();

    let is_markdown = name.ends_with(".md") || name.ends_with(".markdown");

    Ok(KBFileInfo {
        path: file_path.to_string(),
        name,
        size: metadata.len(),
        is_markdown,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    fn create_test_kb(temp_dir: &TempDir) {
        fs::write(temp_dir.path().join("test1.md"), "# Test 1").unwrap();
        fs::write(temp_dir.path().join("test2.md"), "# Test 2").unwrap();
        fs::write(temp_dir.path().join("data.txt"), "Not markdown").unwrap();

        let subdir = temp_dir.path().join("subdir");
        fs::create_dir(&subdir).unwrap();
        fs::write(subdir.join("test3.markdown"), "# Test 3").unwrap();
    }

    #[test]
    fn test_scan_directory_recursive_marks_only_markdown() {
        let temp_dir = TempDir::new().unwrap();
        create_test_kb(&temp_dir);

        let mut files = Vec::new();
        scan_directory_recursive(temp_dir.path(), &mut files).unwrap();

        assert_eq!(files.len(), 3);
        assert!(files.iter().any(|f| f.ends_with(".md")));
        assert!(files.iter().any(|f| f.ends_with(".markdown")));
        assert!(!files.iter().any(|f| f.ends_with(".txt")));
    }

    #[test]
    fn test_scan_directory_recursive_empty_directory() {
        let temp_dir = TempDir::new().unwrap();

        let mut files = Vec::new();
        scan_directory_recursive(temp_dir.path(), &mut files).unwrap();

        assert_eq!(files.len(), 0);
    }

    #[test]
    fn test_scan_directory_recursive_nested() {
        let temp_dir = TempDir::new().unwrap();

        fs::write(temp_dir.path().join("root.md"), "# Root").unwrap();

        let level1 = temp_dir.path().join("level1");
        fs::create_dir(&level1).unwrap();
        fs::write(level1.join("l1.md"), "# Level 1").unwrap();

        let level2 = level1.join("level2");
        fs::create_dir(&level2).unwrap();
        fs::write(level2.join("l2.md"), "# Level 2").unwrap();

        let mut files = Vec::new();
        scan_directory_recursive(temp_dir.path(), &mut files).unwrap();

        assert_eq!(files.len(), 3);
        assert!(files.iter().any(|f| f.contains("root.md")));
        assert!(files.iter().any(|f| f.contains("l1.md")));
        assert!(files.iter().any(|f| f.contains("l2.md")));
    }

    #[test]
    fn test_scan_directory_recursive_nonexistent_path() {
        let mut files = Vec::new();
        let result = scan_directory_recursive(Path::new("/nonexistent"), &mut files);

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Failed to read directory"));
    }

    #[test]
    fn test_get_file_info_markdown_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.md");
        fs::write(&file_path, "# Test Content").unwrap();

        let result = get_file_info_minimal(file_path.to_string_lossy().as_ref());

        assert!(result.is_ok());
        let info = result.unwrap();

        assert_eq!(info.name, "test.md");
        assert!(info.is_markdown);
        assert_eq!(info.size, 14); // "# Test Content" = 14 bytes
    }

    #[test]
    fn test_get_file_info_markdown_extension_variant() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.markdown");
        fs::write(&file_path, "# Test").unwrap();

        let result = get_file_info_minimal(file_path.to_string_lossy().as_ref());

        assert!(result.is_ok());
        let info = result.unwrap();

        assert_eq!(info.name, "test.markdown");
        assert!(info.is_markdown);
    }

    #[test]
    fn test_get_file_info_non_markdown_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("data.txt");
        fs::write(&file_path, "Not markdown").unwrap();

        let result = get_file_info_minimal(file_path.to_string_lossy().as_ref());

        assert!(result.is_ok());
        let info = result.unwrap();

        assert_eq!(info.name, "data.txt");
        assert!(!info.is_markdown);
    }

    #[test]
    fn test_get_file_info_nonexistent_file() {
        let result = get_file_info_minimal("/nonexistent/file.md");

        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }

    #[test]
    fn test_get_file_info_file_size() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("large.md");
        let content = "Large file content with many bytes";
        fs::write(&file_path, content).unwrap();

        let result = get_file_info_minimal(file_path.to_string_lossy().as_ref());

        assert!(result.is_ok());
        let info = result.unwrap();

        assert_eq!(info.size, content.len() as u64);
    }
}

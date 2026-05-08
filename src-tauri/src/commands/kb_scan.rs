use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
struct KBFileInfo {
    path: String,
    name: String,
    size: u64,
    is_markdown: bool,
}

#[command]
pub async fn kb_scan_files(kb_path: String) -> Result<Vec<String>, String> {
    let path = Path::new(&kb_path);
    
    if !path.exists() {
        return Err(format!("KB path does not exist: {}", kb_path));
    }
    
    if !path.is_dir() {
        return Err(format!("KB path is not a directory: {}", kb_path));
    }
    
    let mut files = Vec::new();
    
    scan_directory_recursive(path, &mut files)?;
    
    Ok(files)
}

#[command]
pub async fn kb_write_file(kb_path: String, content: String) -> Result<String, String> {
    let path = Path::new(&kb_path);
    
    if let Some(parent) = path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create directory: {}", e))?;
        }
    }
    
    fs::write(path, &content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(format!("File written to: {}", kb_path))
}

#[command]
pub async fn kb_get_file_info(file_path: String) -> Result<KBFileInfo, String> {
    let path = Path::new(&file_path);
    
    if !path.exists() {
        return Err(format!("File does not exist: {}", file_path));
    }
    
    let metadata = fs::metadata(path)
        .map_err(|e| format!("Failed to get file metadata: {}", e))?;
    
    let name = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("")
        .to_string();
    
    let is_markdown = name.ends_with(".md");
    
    Ok(KBFileInfo {
        path: file_path,
        name,
        size: metadata.len(),
        is_markdown,
    })
}

fn scan_directory_recursive(dir: &Path, files: &mut Vec<String>) -> Result<(), String> {
    let entries = fs::read_dir(dir)
        .map_err(|e| format!("Failed to read directory: {}", e))?;
    
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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    fn create_test_kb(temp_dir: &TempDir) -> String {
        let kb_path = temp_dir.path().to_string_lossy().to_string();
        
        fs::write(temp_dir.path().join("test1.md"), "# Test 1").unwrap();
        fs::write(temp_dir.path().join("test2.md"), "# Test 2").unwrap();
        fs::write(temp_dir.path().join("data.txt"), "Not markdown").unwrap();
        
        let subdir = temp_dir.path().join("subdir");
        fs::create_dir(&subdir).unwrap();
        fs::write(subdir.join("test3.md"), "# Test 3").unwrap();
        
        kb_path
    }

    #[tokio::test]
    async fn test_kb_scan_files_success() {
        let temp_dir = TempDir::new().unwrap();
        let kb_path = create_test_kb(&temp_dir);
        
        let result = kb_scan_files(kb_path).await;
        
        assert!(result.is_ok());
        let files = result.unwrap();
        
        assert_eq!(files.len(), 3);
        assert!(files.iter().any(|f| f.contains("test1.md")));
        assert!(files.iter().any(|f| f.contains("test2.md")));
        assert!(files.iter().any(|f| f.contains("test3.md")));
        assert!(!files.iter().any(|f| f.contains("data.txt")));
    }

    #[tokio::test]
    async fn test_kb_scan_files_nonexistent_path() {
        let result = kb_scan_files("/nonexistent/path").await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }

    #[tokio::test]
    async fn test_kb_scan_files_empty_directory() {
        let temp_dir = TempDir::new().unwrap();
        let kb_path = temp_dir.path().to_string_lossy().to_string();
        
        let result = kb_scan_files(kb_path).await;
        
        assert!(result.is_ok());
        let files = result.unwrap();
        assert_eq!(files.len(), 0);
    }

    #[tokio::test]
    async fn test_kb_write_file_success() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("output.md").to_string_lossy().to_string();
        
        let result = kb_write_file(file_path.clone(), "# Test Content").await;
        
        assert!(result.is_ok());
        assert!(result.unwrap().contains("File written to"));
        
        let content = fs::read_to_string(temp_dir.path().join("output.md")).unwrap();
        assert_eq!(content, "# Test Content");
    }

    #[tokio::test]
    async fn test_kb_write_file_creates_parent_directory() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("newdir/output.md").to_string_lossy().to_string();
        
        let result = kb_write_file(file_path.clone(), "# Test").await;
        
        assert!(result.is_ok());
        assert!(temp_dir.path().join("newdir").exists());
        assert!(temp_dir.path().join("newdir/output.md").exists());
    }

    #[tokio::test]
    async fn test_kb_get_file_info_markdown_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("test.md");
        fs::write(&file_path, "# Test").unwrap();
        
        let result = kb_get_file_info(file_path.to_string_lossy().to_string()).await;
        
        assert!(result.is_ok());
        let info = result.unwrap();
        
        assert_eq!(info.name, "test.md");
        assert!(info.is_markdown);
        assert_eq!(info.size, 6);
    }

    #[tokio::test]
    async fn test_kb_get_file_info_non_markdown_file() {
        let temp_dir = TempDir::new().unwrap();
        let file_path = temp_dir.path().join("data.txt");
        fs::write(&file_path, "Not markdown").unwrap();
        
        let result = kb_get_file_info(file_path.to_string_lossy().to_string()).await;
        
        assert!(result.is_ok());
        let info = result.unwrap();
        
        assert_eq!(info.name, "data.txt");
        assert!(!info.is_markdown);
    }

    #[tokio::test]
    async fn test_kb_get_file_info_nonexistent_file() {
        let result = kb_get_file_info("/nonexistent/file.md".to_string()).await;
        
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("does not exist"));
    }

    #[test]
    fn test_scan_directory_recursive_marks_only_markdown() {
        let temp_dir = TempDir::new().unwrap();
        
        fs::write(temp_dir.path().join("doc1.md"), "# Doc 1").unwrap();
        fs::write(temp_dir.path().join("doc2.markdown"), "# Doc 2").unwrap();
        fs::write(temp_dir.path().join("data.txt"), "Data").unwrap();
        fs::write(temp_dir.path().join("config.json"), "{}").unwrap();
        
        let mut files = Vec::new();
        scan_directory_recursive(temp_dir.path(), &mut files).unwrap();
        
        assert_eq!(files.len(), 2);
        assert!(files.iter().any(|f| f.ends_with(".md")));
        assert!(files.iter().any(|f| f.ends_with(".markdown")));
        assert!(!files.iter().any(|f| f.ends_with(".txt")));
        assert!(!files.iter().any(|f| f.ends_with(".json")));
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
}
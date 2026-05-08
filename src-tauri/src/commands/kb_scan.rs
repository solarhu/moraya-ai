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
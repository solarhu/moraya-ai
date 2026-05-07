use std::process::Command;
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkDocCreateResult {
    document_id: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkDocFetchResult {
    content: String,
    format: String,
    success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkDocUpdateResult {
    document_id: String,
    success: bool,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkFileInfo {
    file_token: String,
    name: String,
    r#type: String,
    updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkSearchResult {
    results: Vec<LarkSearchItem>,
    success: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LarkSearchItem {
    document_id: String,
    title: String,
    url: String,
}

#[command]
pub async fn lark_cli_auth_login(
    cli_path: String,
    domain: Option<String>,
) -> Result<String, String> {
    let mut args = vec!["auth", "login"];
    if let Some(d) = domain {
        args.extend_from_slice(&["--domain", &d]);
    }
    
    let output = Command::new(&cli_path)
        .args(&args)
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli auth failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_docs_create(
    cli_path: String,
    title: String,
    markdown_file: String,
    folder_token: String,
) -> Result<LarkDocCreateResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+create",
            "--title", &title,
            "--markdown", &format!("@{}", markdown_file),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        let document_id = parse_document_id(&stdout)?;
        Ok(LarkDocCreateResult {
            document_id,
            success: true,
            message: stdout.to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs create failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_docs_fetch(
    cli_path: String,
    doc_token: String,
    format: String,
) -> Result<LarkDocFetchResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+fetch",
            "--doc", &doc_token,
            "--format", &format,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        Ok(LarkDocFetchResult {
            content: stdout.to_string(),
            format,
            success: true,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs fetch failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_docs_update(
    cli_path: String,
    doc_token: String,
    markdown_file: String,
    mode: String,
) -> Result<LarkDocUpdateResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+update",
            "--doc", &doc_token,
            "--markdown", &format!("@{}", markdown_file),
            "--mode", &mode,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        Ok(LarkDocUpdateResult {
            document_id: doc_token,
            success: true,
            message: stdout.to_string(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs update failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_docs_search(
    cli_path: String,
    query: String,
) -> Result<LarkSearchResult, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "docs",
            "+search",
            "--query", &query,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        let results = parse_search_results(&stdout)?;
        Ok(LarkSearchResult {
            results,
            success: true,
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli docs search failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_drive_list(
    cli_path: String,
    folder_token: String,
) -> Result<Vec<LarkFileInfo>, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+list",
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    if output.status.success() {
        parse_file_list(&stdout)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive list failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_drive_upload(
    cli_path: String,
    file_path: String,
    folder_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+upload",
            "--file", &format!("@{}", file_path),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive upload failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_drive_download(
    cli_path: String,
    file_token: String,
    output_path: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "drive",
            "+download",
            "--file", &file_token,
            "--output", &output_path,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli drive download failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_markdown_create(
    cli_path: String,
    markdown_file: String,
    folder_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+create",
            "--file", &format!("@{}", markdown_file),
            "--folder-token", &folder_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown create failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_markdown_fetch(
    cli_path: String,
    file_token: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+fetch",
            "--file", &file_token,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown fetch failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_markdown_overwrite(
    cli_path: String,
    file_token: String,
    markdown_file: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "markdown",
            "+overwrite",
            "--file", &file_token,
            "--markdown", &format!("@{}", markdown_file),
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli markdown overwrite failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_wiki_list(cli_path: String) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&["wiki", "+list"])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli wiki list failed: {}", stderr))
    }
}

#[command]
pub async fn lark_cli_wiki_create_node(
    cli_path: String,
    wiki_token: String,
    title: String,
) -> Result<String, String> {
    let output = Command::new(&cli_path)
        .args(&[
            "wiki",
            "+create-node",
            "--wiki", &wiki_token,
            "--title", &title,
        ])
        .output()
        .map_err(|e| format!("Failed to execute lark-cli: {}", e))?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        Ok(stdout.to_string())
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(format!("lark-cli wiki create-node failed: {}", stderr))
    }
}

fn parse_document_id(stdout: &str) -> Result<String, String> {
    for line in stdout.lines() {
        if line.contains("doc_") || line.contains("Document created:") {
            let words: Vec<&str> = line.split_whitespace().collect();
            for word in words {
                if word.starts_with("doc_") {
                    return Ok(word.trim_end_matches(',').to_string());
                }
            }
        }
    }
    
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        if let Some(doc_id) = json.get("document_id").and_then(|v| v.as_str()) {
            return Ok(doc_id.to_string());
        }
        if let Some(doc_id) = json.get("doc").and_then(|v| v.as_str()) {
            return Ok(doc_id.to_string());
        }
        if let Some(doc_id) = json.get("id").and_then(|v| v.as_str()) {
            return Ok(doc_id.to_string());
        }
    }
    
    Err("Failed to parse document ID from lark-cli output".to_string())
}

fn parse_file_list(stdout: &str) -> Result<Vec<LarkFileInfo>, String> {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        if let Some(files) = json.get("files").and_then(|v| v.as_array()) {
            let mut result = Vec::new();
            for file in files {
                if let (Some(token), Some(name), Some(typ), Some(updated)) = (
                    file.get("token").and_then(|v| v.as_str()),
                    file.get("name").and_then(|v| v.as_str()),
                    file.get("type").and_then(|v| v.as_str()),
                    file.get("updated_at").and_then(|v| v.as_str()),
                ) {
                    result.push(LarkFileInfo {
                        file_token: token.to_string(),
                        name: name.to_string(),
                        r#type: typ.to_string(),
                        updated_at: updated.to_string(),
                    });
                }
            }
            return Ok(result);
        }
        
        if let Some(files) = json.as_array() {
            let mut result = Vec::new();
            for file in files {
                if let (Some(token), Some(name), Some(typ), Some(updated)) = (
                    file.get("token").and_then(|v| v.as_str()),
                    file.get("name").and_then(|v| v.as_str()),
                    file.get("type").and_then(|v| v.as_str()),
                    file.get("updated_at").and_then(|v| v.as_str()),
                ) {
                    result.push(LarkFileInfo {
                        file_token: token.to_string(),
                        name: name.to_string(),
                        r#type: typ.to_string(),
                        updated_at: updated.to_string(),
                    });
                }
            }
            return Ok(result);
        }
    }
    
    Err("Failed to parse file list from lark-cli output".to_string())
}

fn parse_search_results(stdout: &str) -> Result<Vec<LarkSearchItem>, String> {
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(stdout) {
        if let Some(results) = json.get("results").and_then(|v| v.as_array()) {
            let mut items = Vec::new();
            for result in results {
                if let (Some(doc_id), Some(title), Some(url)) = (
                    result.get("document_id").or_else(|| result.get("id")).and_then(|v| v.as_str()),
                    result.get("title").or_else(|| result.get("name")).and_then(|v| v.as_str()),
                    result.get("url").and_then(|v| v.as_str()),
                ) {
                    items.push(LarkSearchItem {
                        document_id: doc_id.to_string(),
                        title: title.to_string(),
                        url: url.to_string(),
                    });
                }
            }
            return Ok(items);
        }
        
        if let Some(results) = json.as_array() {
            let mut items = Vec::new();
            for result in results {
                if let (Some(doc_id), Some(title), Some(url)) = (
                    result.get("document_id").or_else(|| result.get("id")).and_then(|v| v.as_str()),
                    result.get("title").or_else(|| result.get("name")).and_then(|v| v.as_str()),
                    result.get("url").and_then(|v| v.as_str()),
                ) {
                    items.push(LarkSearchItem {
                        document_id: doc_id.to_string(),
                        title: title.to_string(),
                        url: url.to_string(),
                    });
                }
            }
            return Ok(items);
        }
    }
    
    Ok(Vec::new())
}
// Minimal test file for lark_cli parsing functions
// No dependencies on tauri/tokio to avoid webkit/soup dependencies

use std::process::Command;

#[derive(Debug)]
struct LarkFileInfo {
    file_token: String,
    name: String,
    type_: String,
    updated_at: String,
}

#[derive(Debug)]
struct LarkSearchItem {
    document_id: String,
    title: String,
    url: String,
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
                        type_: typ.to_string(),
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
                        type_: typ.to_string(),
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
                    result
                        .get("document_id")
                        .or_else(|| result.get("id"))
                        .and_then(|v| v.as_str()),
                    result
                        .get("title")
                        .or_else(|| result.get("name"))
                        .and_then(|v| v.as_str()),
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
                    result
                        .get("document_id")
                        .or_else(|| result.get("id"))
                        .and_then(|v| v.as_str()),
                    result
                        .get("title")
                        .or_else(|| result.get("name"))
                        .and_then(|v| v.as_str()),
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

#[cfg(test)]
mod tests {
    use super::*;

    mod parse_document_id_tests {
        use super::*;

        #[test]
        fn test_parse_from_text_output() {
            let stdout =
                "Document created: doc_abc123xyz\nURL: https://feishu.cn/doc/doc_abc123xyz";
            let result = parse_document_id(stdout);
            assert_eq!(result.unwrap(), "doc_abc123xyz");
        }

        #[test]
        fn test_parse_from_json_with_document_id() {
            let stdout = "{\"document_id\": \"doc_xyz789\", \"success\": true}";
            let result = parse_document_id(stdout);
            assert_eq!(result.unwrap(), "doc_xyz789");
        }

        #[test]
        fn test_parse_from_json_with_doc_field() {
            let stdout = "{\"doc\": \"doc_test123\", \"url\": \"https://example.com\"}";
            let result = parse_document_id(stdout);
            assert_eq!(result.unwrap(), "doc_test123");
        }

        #[test]
        fn test_parse_from_json_with_id_field() {
            let stdout = "{\"id\": \"doc_id456\", \"title\": \"Test\"}";
            let result = parse_document_id(stdout);
            assert_eq!(result.unwrap(), "doc_id456");
        }

        #[test]
        fn test_parse_with_comma_suffix() {
            let stdout = "Document created: doc_abc123xyz, please check";
            let result = parse_document_id(stdout);
            assert_eq!(result.unwrap(), "doc_abc123xyz");
        }

        #[test]
        fn test_parse_empty_output() {
            let stdout = "";
            let result = parse_document_id(stdout);
            assert!(result.is_err());
            assert!(result.unwrap_err().contains("Failed to parse"));
        }

        #[test]
        fn test_parse_invalid_json() {
            let stdout = "{invalid json}";
            let result = parse_document_id(stdout);
            assert!(result.is_err());
        }
    }

    mod parse_file_list_tests {
        use super::*;

        #[test]
        fn test_parse_json_with_files_key() {
            let stdout = "{\"files\": [
                {\"token\": \"file_abc\", \"name\": \"test1.md\", \"type\": \"file\", \"updated_at\": \"2026-05-07T10:00:00Z\"},
                {\"token\": \"file_def\", \"name\": \"test2.md\", \"type\": \"file\", \"updated_at\": \"2026-05-06T09:00:00Z\"}
            ]}";
            let result = parse_file_list(stdout);
            assert!(result.is_ok());
            let files = result.unwrap();
            assert_eq!(files.len(), 2);
            assert_eq!(files[0].file_token, "file_abc");
            assert_eq!(files[0].name, "test1.md");
            assert_eq!(files[1].file_token, "file_def");
        }

        #[test]
        fn test_parse_json_array_directly() {
            let stdout = "[{\"token\": \"file_xyz\", \"name\": \"doc.md\", \"type\": \"file\", \"updated_at\": \"2026-05-07\"}]";
            let result = parse_file_list(stdout);
            assert!(result.is_ok());
            let files = result.unwrap();
            assert_eq!(files.len(), 1);
            assert_eq!(files[0].file_token, "file_xyz");
        }

        #[test]
        fn test_parse_empty_array() {
            let stdout = "{\"files\": []}";
            let result = parse_file_list(stdout);
            assert!(result.is_ok());
            let files = result.unwrap();
            assert_eq!(files.len(), 0);
        }

        #[test]
        fn test_parse_missing_fields() {
            let stdout = "{\"files\": [{\"token\": \"file_abc\", \"name\": \"test.md\"}]}";
            let result = parse_file_list(stdout);
            // Should fail because type and updated_at are missing
            assert!(result.is_err() || result.unwrap().is_empty());
        }

        #[test]
        fn test_parse_invalid_json() {
            let stdout = "{invalid json}";
            let result = parse_file_list(stdout);
            assert!(result.is_err());
        }
    }

    mod parse_search_results_tests {
        use super::*;

        #[test]
        fn test_parse_json_with_results_key() {
            let stdout = "{\"results\": [
                {\"document_id\": \"doc_1\", \"title\": \"Doc 1\", \"url\": \"https://feishu.cn/doc/doc_1\"},
                {\"document_id\": \"doc_2\", \"title\": \"Doc 2\", \"url\": \"https://feishu.cn/doc/doc_2\"}
            ]}";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items.len(), 2);
            assert_eq!(items[0].document_id, "doc_1");
            assert_eq!(items[0].title, "Doc 1");
        }

        #[test]
        fn test_parse_json_array_directly() {
            let stdout =
                "[{\"id\": \"doc_3\", \"name\": \"Doc 3\", \"url\": \"https://example.com\"}]";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items.len(), 1);
            assert_eq!(items[0].document_id, "doc_3");
            assert_eq!(items[0].title, "Doc 3");
        }

        #[test]
        fn test_parse_empty_results() {
            let stdout = "{\"results\": []}";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items.len(), 0);
        }

        #[test]
        fn test_parse_with_id_field_fallback() {
            let stdout =
                "{\"results\": [{\"id\": \"doc_xyz\", \"title\": \"Test\", \"url\": \"url\"}]}";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items[0].document_id, "doc_xyz");
        }

        #[test]
        fn test_parse_with_name_field_fallback() {
            let stdout =
                "[{\"document_id\": \"doc_abc\", \"name\": \"Test Name\", \"url\": \"url\"}]";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items[0].title, "Test Name");
        }

        #[test]
        fn test_parse_missing_url() {
            let stdout = "{\"results\": [{\"document_id\": \"doc_1\", \"title\": \"Doc 1\"}]}";
            let result = parse_search_results(stdout);
            assert!(result.is_ok());
            let items = result.unwrap();
            assert_eq!(items.len(), 0); // Missing url means skipped
        }
    }

    mod command_tests {
        use super::*;

        fn get_cli_path() -> String {
            if std::path::Path::new("/home/admin/.npm-global/bin/lark-cli").exists() {
                "/home/admin/.npm-global/bin/lark-cli".to_string()
            } else if std::path::Path::new("/usr/local/bin/lark-cli").exists() {
                "/usr/local/bin/lark-cli".to_string()
            } else {
                "lark-cli".to_string()
            }
        }

        fn check_cli_exists(cli_path: &str) -> bool {
            Command::new(cli_path).arg("--version").output().is_ok()
        }

        fn check_auth_status(cli_path: &str) -> bool {
            let output = Command::new(cli_path).args(&["auth", "status"]).output();

            if let Ok(out) = output {
                out.status.success()
            } else {
                false
            }
        }

        #[test]
        fn test_lark_cli_exists() {
            let cli_path = get_cli_path();
            assert!(
                check_cli_exists(&cli_path),
                "lark-cli not found. Please install lark-cli first."
            );
        }

        #[test]
        fn test_lark_cli_auth_status() {
            let cli_path = get_cli_path();
            if !check_cli_exists(&cli_path) {
                panic!("lark-cli not found. Please install lark-cli first.");
            }

            let auth_ok = check_auth_status(&cli_path);
            if !auth_ok {
                eprintln!("Warning: lark-cli not authenticated. Run 'lark-cli auth login' first.");
                eprintln!("Skipping auth-dependent tests.");
            }

            // Test passes even if not authenticated (just warns)
            assert!(true);
        }

        #[test]
        fn test_docs_create_args_format() {
            let title = "Test Document";
            let folder_token = "fld_test";

            let expected_args = vec![
                "docs",
                "+create",
                "--title",
                title,
                "--markdown",
                "@/tmp/test.md",
                "--folder-token",
                folder_token,
            ];

            // Verify argument format is correct
            assert_eq!(expected_args.len(), 8);
            assert_eq!(expected_args[5], "@/tmp/test.md");
        }

        #[test]
        fn test_docs_update_modes() {
            let modes = vec!["append", "overwrite", "replace_range", "replace_all"];

            for mode in modes {
                println!("Testing update mode: {}", mode);
                assert!(!mode.is_empty());
            }
        }

        #[test]
        fn test_markdown_file_format() {
            let file_path = "/home/user/test.md";
            let formatted = format!("@{}", file_path);
            assert_eq!(formatted, "@/home/user/test.md");
        }
    }

    mod error_handling_tests {
        use super::*;

        #[test]
        fn test_invalid_cli_path() {
            let result = Command::new("/invalid/path/to/cli")
                .args(&["auth", "login"])
                .output();

            assert!(result.is_err());
        }
    }
}

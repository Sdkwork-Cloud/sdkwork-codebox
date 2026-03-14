use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex, OnceLock};

use codebox_lib::{
    update_settings, AppSettings, AppState, Database, MultiAppConfig, ProxyService,
};

/// 为测试设置隔离的 HOME 目录，避免污染真实用户数据。
pub fn ensure_test_home() -> &'static Path {
    static HOME: OnceLock<PathBuf> = OnceLock::new();
    HOME.get_or_init(|| {
        let base = std::env::temp_dir().join("codebox-test-home");
        if base.exists() {
            let _ = std::fs::remove_dir_all(&base);
        }
        std::fs::create_dir_all(&base).expect("create test home");
        // Windows 上 `dirs::home_dir()` 不受 HOME/USERPROFILE 影响（走 Known Folder API），
        // 用 CODEBOX_TEST_HOME 显式覆盖，以确保测试不会污染真实用户目录。
        std::env::set_var("CODEBOX_TEST_HOME", &base);
        std::env::set_var("HOME", &base);
        #[cfg(windows)]
        std::env::set_var("USERPROFILE", &base);
        base
    })
    .as_path()
}

/// 清理测试目录中生成的配置文件与缓存。
pub fn reset_test_fs() {
    let home = ensure_test_home();
    for sub in [".claude", ".codex", ".gemini"] {
        let path = home.join(sub);
        if path.exists() {
            if let Err(err) = std::fs::remove_dir_all(&path) {
                eprintln!("failed to clean {}: {}", path.display(), err);
            }
        }
    }
    let app_config_dir = test_app_config_dir();
    if app_config_dir.exists() {
        let _ = std::fs::remove_dir_all(&app_config_dir);
    }
    let legacy_platform_app_config_dir = legacy_platform_test_app_config_dir();
    if legacy_platform_app_config_dir.exists() {
        let _ = std::fs::remove_dir_all(&legacy_platform_app_config_dir);
    }
    let legacy_app_config_dir = home.join(".codebox");
    if legacy_app_config_dir.exists() {
        let _ = std::fs::remove_dir_all(&legacy_app_config_dir);
    }
    let claude_json = home.join(".claude.json");
    if claude_json.exists() {
        let _ = std::fs::remove_file(&claude_json);
    }

    // 重置内存中的设置缓存，确保测试环境不受上一次调用影响
    let _ = update_settings(AppSettings::default());
}

pub fn test_app_config_dir() -> PathBuf {
    ensure_test_home().join(".sdkwork").join("codebox")
}

fn legacy_platform_test_app_config_dir() -> PathBuf {
    let home = ensure_test_home();

    #[cfg(target_os = "macos")]
    {
        return home
            .join("Library")
            .join("Application Support")
            .join("sdkwork")
            .join("codebox");
    }

    #[cfg(target_os = "windows")]
    {
        return home
            .join("AppData")
            .join("Roaming")
            .join("sdkwork")
            .join("codebox");
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        return home.join(".config").join("sdkwork").join("codebox");
    }
}

/// 全局互斥锁，避免多测试并发写入相同的 HOME 目录。
pub fn test_mutex() -> &'static Mutex<()> {
    static MUTEX: OnceLock<Mutex<()>> = OnceLock::new();
    MUTEX.get_or_init(|| Mutex::new(()))
}

/// 创建测试用的 AppState，包含一个空的数据库
#[allow(dead_code)]
pub fn create_test_state() -> Result<AppState, Box<dyn std::error::Error>> {
    let db = Arc::new(Database::init()?);
    let proxy_service = ProxyService::new(db.clone());
    Ok(AppState { db, proxy_service })
}

/// 创建测试用的 AppState，并从 MultiAppConfig 迁移数据
#[allow(dead_code)]
pub fn create_test_state_with_config(
    config: &MultiAppConfig,
) -> Result<AppState, Box<dyn std::error::Error>> {
    let db = Arc::new(Database::init()?);
    db.migrate_from_json(config)?;
    let proxy_service = ProxyService::new(db.clone());
    Ok(AppState { db, proxy_service })
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: 'required' | 'configured' | 'pending';
  notes?: string;
}

export interface RoadmapSection {
  title: string;
  iconName: string;
  description: string;
  items: ChecklistItem[];
}

export const roadmapSections: RoadmapSection[] = [
  {
    title: "Required Project Information",
    iconName: "Info",
    description: "Core identifier attributes and digital touchpoints to map production integrations.",
    items: [
      { id: "proj_name", label: "Final project name", status: "pending", notes: "$VIRAL Ecosystem" },
      { id: "app_name", label: "Final app name", status: "pending", notes: "$VIRAL Mini App" },
      { id: "website_dom", label: "Final website/domain", status: "pending", notes: "https://viral-app.com" },
      { id: "tg_bot_user", label: "Final Telegram bot username", status: "pending", notes: "@Viral_App_Bot" },
      { id: "tma_url", label: "Final Telegram Mini App URL", status: "pending", notes: "https://t.me/Viral_App_Bot" },
      { id: "tg_channel", label: "Official Telegram channel/group links", status: "pending", notes: "https://t.me/VIRAL_App_Community" },
      { id: "x_link", label: "Official X/Twitter link", status: "pending", notes: "twitter.com/viral_app" },
      { id: "support_contact", label: "Support contact", status: "pending", notes: "@viral_support_official" },
      { id: "proj_desc", label: "Official project description", status: "pending", notes: "Web3 mutual promotional platform." },
      { id: "short_slogan", label: "Final short slogan", status: "pending", notes: "Promoters spend, users earn, ecosystem grows." }
    ]
  },
  {
    title: "Required Branding Assets",
    iconName: "Palette",
    description: "Visual files and design guidelines needed for the UI skin and social platforms.",
    items: [
      { id: "brand_logo_svg", label: "Logo in SVG/PNG", status: "pending", notes: "Vector preferred for high-res screens" },
      { id: "brand_logo_trans", label: "Logo on transparent background", status: "pending", notes: "For overlays" },
      { id: "brand_app_icon", label: "App icon", status: "pending", notes: "512x512px rounding mask" },
      { id: "brand_token_img", label: "Token image/coin image", status: "pending", notes: "$VIRAL logo symbol" },
      { id: "brand_hero", label: "Website hero image", status: "pending", notes: "Banner illustration" },
      { id: "brand_banners", label: "Banner images", status: "pending", notes: "Promotional marketing dimensions" },
      { id: "brand_colors", label: "Color palette confirmation", status: "configured", notes: "Using Deep Purple (#8A2BFF) & Mint (#38F8B0)" },
      { id: "brand_fonts", label: "Font preference", status: "configured", notes: "Inter paired with JetBrains Mono" },
      { id: "brand_socials", label: "Social media graphics", status: "pending", notes: "Discord and Twitter banners" },
      { id: "brand_blum", label: "BLUM/Memepad banner if needed", status: "pending", notes: "Custom promotional graphic" }
    ]
  },
  {
    title: "Required Token Data",
    iconName: "Coins",
    description: "On-chain specifications for $VIRAL utility parameters and DEX liquidity pools.",
    items: [
      { id: "tok_blum_link", label: "$VIRAL BLUM/Memepad link", status: "pending", notes: "Pre-launch bonding address" },
      { id: "tok_name", label: "Token name", status: "pending", notes: "Viral Token" },
      { id: "tok_ticker", label: "Token ticker: $VIRAL", status: "configured", notes: "$VIRAL" },
      { id: "tok_supply", label: "Total supply: 1,000,000,000", status: "configured", notes: "1 Billion fixed" },
      { id: "tok_decimals", label: "Decimals if available", status: "pending", notes: "9 Decimals on TON" },
      { id: "tok_contract", label: "Contract address after creation", status: "pending", notes: "TON Master Smart Contract" },
      { id: "tok_image_url", label: "Token image URL", status: "pending", notes: "IPFS CDN link" },
      { id: "tok_bonding_status", label: "Bonding/migration status", status: "pending", notes: "Simulated pre-bonding active" },
      { id: "tok_dex_listing", label: "DEX listing status after bonding", status: "pending", notes: "DeDust / STON.fi pool" },
      { id: "tok_drop_rules", label: "Real $VIRAL claim/drop rules", status: "configured", notes: "1:1 calculated relative to system pool" }
    ]
  },
  {
    title: "Required Wallet Data",
    iconName: "Wallet",
    description: "Public blockchain addresses for platform finance, creators, and reward distributions. (CRITICAL: Public addresses only. Never share seed phrases or private keys.)",
    items: [
      { id: "wal_creator", label: "VIRAL_Creator_wallet address", status: "pending", notes: "Reserve wallet (buys 200M $VIRAL at start)" },
      { id: "wal_fee", label: "VIRAL_Fee_wallet address", status: "pending", notes: "Receives 10% from turnover & actions" },
      { id: "wal_claim", label: "Claim/drop wallet address if different", status: "pending", notes: "Funding faucet reserve" },
      { id: "wal_treasury", label: "Treasury wallet address if needed", status: "pending", notes: "Ecosystem development multisig" },
      { id: "wal_receiving", label: "TON/GRAM receiving wallet if needed", status: "pending", notes: "For payments & deposits" }
    ]
  },
  {
    title: "Required Admin Data",
    iconName: "UserCheck",
    description: "Numerical user identifiers authorized to run administrative controls and audits.",
    items: [
      { id: "adm_id_1", label: "Telegram Admin ID: 8618331744", status: "configured", notes: "Creator Admin (Primary)" },
      { id: "adm_id_2", label: "Telegram Admin ID: 6228196481", status: "configured", notes: "Admin Account 2" },
      { id: "adm_id_3", label: "Telegram Admin ID: 5314622858", status: "configured", notes: "Admin Account 3" },
      { id: "adm_validation", label: "Backend verification check", status: "configured", notes: "Access validated strictly via numeric Telegram ID on backend" }
    ]
  },
  {
    title: "Required API and Platform Credentials",
    iconName: "Lock",
    description: "Secrets, credentials, and API client configs. (IMPORTANT: Must be stored only in secure environment variables. Never expose in frontend code.)",
    items: [
      { id: "cre_tg_token", label: "Telegram Bot Token", status: "pending", notes: "Obtained from @BotFather" },
      { id: "cre_tma_init", label: "Telegram Mini App settings", status: "configured", notes: "Validation algorithms ready" },
      { id: "cre_ton_manifest", label: "TonConnect manifest URL", status: "configured", notes: "Public URL hosting metadata JSON" },
      { id: "cre_ton_api", label: "TonAPI key or alternative TON API", status: "pending", notes: "For scanning real-time wallet transactions" },
      { id: "cre_google_id", label: "Google OAuth Client ID", status: "pending", notes: "For Google login" },
      { id: "cre_google_sec", label: "Google OAuth Client Secret", status: "pending", notes: "For backend token validation" },
      { id: "cre_social_cre", label: "Social login credentials if used", status: "pending", notes: "Twitter/X, Discord clients" },
      { id: "cre_db", label: "Database credentials", status: "configured", notes: "Production Firestore/Postgres string" },
      { id: "cre_hosting", label: "Hosting credentials", status: "configured", notes: "Cloud Run / Docker" },
      { id: "cre_dns", label: "Domain/DNS access", status: "pending", notes: "For pointing records" },
      { id: "cre_analytics", label: "Analytics access", status: "pending", notes: "Google Analytics / Mixpanel" },
      { id: "cre_smtp", label: "E-mail/SMTP provider if needed", status: "pending", notes: "SendGrid / Mailgun" }
    ]
  },
  {
    title: "Required Authentication Setup",
    iconName: "ShieldCheck",
    description: "User identity verification pipeline and security de-duplication rules.",
    items: [
      { id: "auth_tg_login", label: "Telegram Login integration", status: "configured", notes: "Secure session management" },
      { id: "auth_tg_val", label: "Telegram WebApp initData validation", status: "configured", notes: "Cryptographic signature checks" },
      { id: "auth_google_login", label: "Google Login configuration", status: "configured", notes: "Auth validation endpoints active" },
      { id: "auth_social_arch", label: "Social login architecture", status: "configured", notes: "Multi-login unified session schema" },
      { id: "auth_linking", label: "Account linking logic", status: "configured", notes: "Merge telegram & Google records safely" },
      { id: "auth_dedup", label: "Duplicate account protection", status: "configured", notes: "Blocks duplicate Telegram ID / Google registration" },
      { id: "auth_wallet_prot", label: "Wallet linking protection", status: "configured", notes: "1-to-1 association strictly enforced" },
      { id: "auth_profile_ver", label: "User profile verification", status: "configured", notes: "Starts at 'New User' with progression levels" }
    ]
  },
  {
    title: "Required TonConnect Setup",
    iconName: "Share2",
    description: "TonConnect protocol details and claim/drop smart contract transaction payload structures.",
    items: [
      { id: "ton_manifest_cfg", label: "TonConnect manifest", status: "configured", notes: "tonconnect-manifest.json" },
      { id: "ton_app_name", label: "App name inside manifest", status: "configured", notes: "$VIRAL Ecosystem" },
      { id: "ton_app_icon", label: "App icon URL inside manifest", status: "configured", notes: "Public URL of branding asset" },
      { id: "ton_app_url", label: "App URL inside manifest", status: "configured", notes: "Matching production domain" },
      { id: "ton_flow_supp", label: "Supported wallet flow", status: "configured", notes: "Tonkeeper & MyTonWallet clients verified" },
      { id: "ton_proof_ver", label: "Wallet proof verification if needed", status: "configured", notes: "Cryptographic proof validation" },
      { id: "ton_bal_api", label: "TON balance API integration", status: "configured", notes: "Refreshes user balance cache dynamically" },
      { id: "ton_viral_api", label: "$VIRAL balance API after bonding", status: "configured", notes: "Tokens balance scanner" },
      { id: "ton_tx_flow", label: "Claim/drop transaction flow", status: "configured", notes: "Pre-configured payload formats ready" }
    ]
  },
  {
    title: "Required Business Rules",
    iconName: "Percent",
    description: "Economic parameters, fees, and operational logic that drive the system's token loop.",
    items: [
      { id: "biz_starter", label: "Starter bonus: 100 vVIRAL", status: "configured", notes: "Instantly granted to new users" },
      { id: "biz_fee_pct", label: "Platform fee: 10%", status: "configured", notes: "Deducted upon campaign setup" },
      { id: "biz_fee_wal", label: "Fee wallet: VIRAL_Fee_wallet", status: "configured", notes: "Accounting ledger routing" },
      { id: "biz_ref_pct", label: "Referral reward: 10% of valid approved invited-user earnings", status: "configured", notes: "Continuous on-chain ledger accruals" },
      { id: "biz_burn", label: "Burn: disabled", status: "configured", notes: "No automatic token burning in the current model" },
      { id: "biz_lock", label: "Lock: disabled", status: "configured", notes: "Liquid circulation with no custom lock parameters" },
      { id: "biz_escrow", label: "Campaign escrow: required", status: "configured", notes: "90% of budget secured on campaign creation" },
      { id: "biz_reward_pend", label: "Reward pending status: required", status: "configured", notes: "Secures funds during review periods" },
      { id: "biz_antibot", label: "Anti-bot check: required", status: "configured", notes: "Mandatory automated activity scoring" },
      { id: "biz_manual_rev", label: "Manual admin review: required for suspicious actions", status: "configured", notes: "Flagged actions held in Admin panel" }
    ]
  },
  {
    title: "Required Campaign Rules",
    iconName: "Settings",
    description: "Operational limits and refund protocols for advertisers and resource submissions.",
    items: [
      { id: "cam_res_types", label: "Allowed resource types", status: "configured", notes: "Bots, Mini Apps, Channels, Groups, Websites, Other" },
      { id: "cam_types", label: "Allowed campaign types", status: "configured", notes: "Telegram Subscription, Bot Start, Website Click, Custom Action" },
      { id: "cam_min_bud", label: "Minimum campaign budget", status: "configured", notes: "100 vVIRAL" },
      { id: "cam_max_bud", label: "Maximum campaign budget", status: "configured", notes: "10,000,000 vVIRAL" },
      { id: "cam_min_rew", label: "Minimum reward per action", status: "configured", notes: "1 vVIRAL" },
      { id: "cam_max_rew", label: "Maximum reward per action", status: "configured", notes: "10,000 vVIRAL" },
      { id: "cam_duration", label: "Campaign duration limits", status: "configured", notes: "Up to 180 days active" },
      { id: "cam_refund", label: "Refund rules", status: "configured", notes: "Unused escrow refunded to advertiser upon completion" },
      { id: "cam_reject_rules", label: "Rejected action rules", status: "configured", notes: "Escrow returned to campaign available budget" },
      { id: "cam_manual_adm", label: "Manual review rules", status: "configured", notes: "Admins approve or reject suspicious tasks" }
    ]
  },
  {
    title: "Required Anti-Bot Protection",
    iconName: "Zap",
    description: "Automated filters to detect, flag, and suspend fraudulent account activity.",
    items: [
      { id: "bot_tg_check", label: "Telegram ID duplicate check", status: "configured", notes: "One unique account per Telegram user ID" },
      { id: "bot_wal_check", label: "Wallet duplicate check", status: "configured", notes: "Blocked at wallet registration if already linked" },
      { id: "bot_em_check", label: "Email duplicate check", status: "configured", notes: "Strict one-account-per-email policy" },
      { id: "bot_fingerprint", label: "Device/browser fingerprint if available", status: "pending", notes: "Client cookie tracking" },
      { id: "bot_proxy", label: "IP/VPN/proxy risk check if available", status: "pending", notes: "Requires integration with geolocation API" },
      { id: "bot_rate_lim", label: "Rate limits", status: "configured", notes: "Protects API endpoints against high frequency spam" },
      { id: "bot_sus_ref", label: "Suspicious referral detection", status: "configured", notes: "Flags high-velocity invites" },
      { id: "bot_delay", label: "Reward delay system", status: "configured", notes: "Holds payouts based on user risk score" },
      { id: "bot_queue", label: "Manual review queue", status: "configured", notes: "Isolates risk scores above 40%" },
      { id: "bot_flag", label: "Fraud flag system", status: "configured", notes: "Adds user accounts to Audit Log with action options" }
    ]
  },
  {
    title: "Required Legal Texts",
    iconName: "FileText",
    description: "User policies, risk disclaimers, and compliance declarations to deploy publicly.",
    items: [
      { id: "leg_terms", label: "Terms of Use", status: "configured", notes: "Comprehensive service agreement" },
      { id: "leg_privacy", label: "Privacy Policy", status: "configured", notes: "Data retention and cookies compliance" },
      { id: "leg_cookies", label: "Cookie Policy if website uses cookies", status: "configured", notes: "Included in standard privacy sections" },
      { id: "leg_risk", label: "Risk Disclaimer", status: "configured", notes: "Explicitly details beta virtual status" },
      { id: "leg_token_util", label: "Token Utility Disclaimer", status: "configured", notes: "Confirms non-security, utility status" },
      { id: "leg_no_inv", label: "No Investment Disclaimer", status: "configured", notes: "No profit guarantees, not financial advice" },
      { id: "leg_rew_rules", label: "User reward rules", status: "configured", notes: "Specifies valid action validation" },
      { id: "leg_adv_rules", label: "Campaign advertiser rules", status: "configured", notes: "Escrow locking and validation agreement" },
      { id: "leg_refund_policy", label: "Refund rules", status: "configured", notes: "Advertiser fee & budget refund policy" },
      { id: "leg_antifraud", label: "Anti-fraud policy", status: "configured", notes: "Agreement that bots/fraud result in forfeiture" }
    ]
  },
  {
    title: "Required Production Infrastructure",
    iconName: "Database",
    description: "DevOps stack, backup pipelines, and secure cloud environments to sustain production scale.",
    items: [
      { id: "inf_hosting", label: "Hosting platform", status: "configured", notes: "Cloud Run container system" },
      { id: "inf_backend", label: "Backend server", status: "configured", notes: "Node.js Express TypeScript server" },
      { id: "inf_database", label: "Database", status: "configured", notes: "Persistent Firestore database with blueprint config" },
      { id: "inf_storage", label: "File storage", status: "configured", notes: "Cloud Storage for assets" },
      { id: "inf_domain", label: "Domain", status: "pending", notes: "Acquiring custom SSL domain" },
      { id: "inf_ssl", label: "SSL certificate", status: "pending", notes: "Automatic HTTPS routing" },
      { id: "inf_env", label: "Environment variables", status: "configured", notes: "All key/secrets stored on backend server" },
      { id: "inf_admin", label: "Admin panel access", status: "configured", notes: "Verified secure Telegram login ID gate" },
      { id: "inf_backup", label: "Backup logic", status: "configured", notes: "Scheduled database backup snapshot script" },
      { id: "inf_mon", label: "Monitoring/logging", status: "configured", notes: "Error logging & server monitoring active" }
    ]
  },
  {
    title: "Required Launch Checklist",
    iconName: "CheckSquare",
    description: "Operational validation audit list: Everything must be tested and fully functional.",
    items: [
      { id: "lch_tg_login", label: "Telegram login", status: "configured", notes: "Authentication check successful" },
      { id: "lch_google_login", label: "Google login", status: "configured", notes: "Auth verified" },
      { id: "lch_tonconnect", label: "TonConnect", status: "configured", notes: "Direct decentralized wallets connected" },
      { id: "lch_wallet_page", label: "Wallet page", status: "configured", notes: "Balances, history, and claiming active" },
      { id: "lch_vviral_bal", label: "vVIRAL balance", status: "configured", notes: "Ledger transaction calculations correct" },
      { id: "lch_starter", label: "Starter bonus", status: "configured", notes: "+100 vVIRAL on first sign up" },
      { id: "lch_ref_links", label: "Referral links", status: "configured", notes: "Generates unique URL + tracking" },
      { id: "lch_add_res", label: "Add resource", status: "configured", notes: "User can register bots, websites, channels" },
      { id: "lch_create_cam", label: "Create campaign", status: "configured", notes: "Launches with reward per action" },
      { id: "lch_escrow", label: "Campaign escrow", status: "configured", notes: "Locks budget and manages platform fee" },
      { id: "lch_earn_tasks", label: "Earn tasks", status: "configured", notes: "Complete, verification data, and rewards" },
      { id: "lch_pending", label: "Pending rewards", status: "configured", notes: "Locked in escrow under verification state" },
      { id: "lch_antibot", label: "Anti-bot checks", status: "configured", notes: "Flags high risk completions instantly" },
      { id: "lch_admin_panel", label: "Admin panel", status: "configured", notes: "Audit logs, fraud flags, system variables" },
      { id: "lch_fee_accounting", label: "Fee wallet accounting", status: "configured", notes: "Locks platform 10% on VIRAL_Fee_wallet" },
      { id: "lch_ledger", label: "Transaction ledger", status: "configured", notes: "Maintains absolute ledger consistency" },
      { id: "lch_faq_page", label: "FAQ page", status: "configured", notes: "Comprehensive questions integrated" },
      { id: "lch_legal", label: "Legal pages", status: "configured", notes: "Terms and risk disclaimers verified" },
      { id: "lch_no_demo", label: "No demo balances", status: "configured", notes: "Real production calculations only" },
      { id: "lch_no_fake", label: "No fake data", status: "configured", notes: "Valid ledger validation" }
    ]
  }
];

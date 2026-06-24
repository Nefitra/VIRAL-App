export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

export interface FAQCategory {
  category: string;
  items: FAQItem[];
}

export const faqCategories: FAQCategory[] = [
  {
    category: "Platform Basics",
    items: [
      {
        id: 1,
        question: "What is $VIRAL App?",
        answer: "$VIRAL App is a Telegram-based Web3 ecosystem for mutual promotion. Users can promote their bots, Mini Apps, websites, channels, tokens, games and other digital resources."
      },
      {
        id: 2,
        question: "What is the main idea of the project?",
        answer: "The main idea is simple: users use $VIRAL as internal promotion fuel, promote their own projects and help other users grow."
      },
      {
        id: 3,
        question: "What is $VIRAL token?",
        answer: "$VIRAL is a utility token used inside the ecosystem for promotion, advertising, visibility boosts, activity rewards, referrals and platform actions."
      },
      {
        id: 4,
        question: "Is $VIRAL an investment?",
        answer: "No. $VIRAL is a utility token. It is not financial advice, not an investment offer and does not guarantee profit, income or price growth."
      },
      {
        id: 29,
        question: "Who can use the app?",
        answer: "Anyone who wants to promote a digital resource or earn rewards by completing verified promotion tasks."
      },
      {
        id: 30,
        question: "What is the goal of $VIRAL App?",
        answer: "The goal is to build a Web3 mutual promotion platform where users spend $VIRAL to promote projects and earn $VIRAL by helping the ecosystem grow."
      }
    ]
  },
  {
    category: "Promotion & Campaigns",
    items: [
      {
        id: 5,
        question: "What can I promote?",
        answer: "You can promote Telegram bots, Telegram Mini Apps, Telegram channels, websites, Web3 projects, tokens, games, communities, apps, services and social media pages."
      },
      {
        id: 6,
        question: "How does promotion work?",
        answer: "You add your resource, create a campaign, set a budget in $VIRAL or vVIRAL, and users receive rewards only for verified actions."
      },
      {
        id: 14,
        question: "How does escrow protect advertisers?",
        answer: "Campaign budgets are locked in escrow. Rewards are released only after actions are verified and approved by the platform."
      },
      {
        id: 15,
        question: "Why are rewards sometimes pending?",
        answer: "Rewards may be pending while the system checks for bots, duplicate accounts, fake clicks or suspicious activity."
      },
      {
        id: 16,
        question: "What happens if an action is fake?",
        answer: "Fake or suspicious actions are rejected. The user does not receive a reward, and the advertiser’s budget remains protected."
      },
      {
        id: 26,
        question: "Can I promote my project without tokens?",
        answer: "You can earn vVIRAL through verified activity or buy $VIRAL/vVIRAL credits when available. Promotion requires campaign fuel."
      }
    ]
  },
  {
    category: "Tokens & Rewards",
    items: [
      {
        id: 7,
        question: "What is vVIRAL?",
        answer: "vVIRAL is an internal virtual balance used before real $VIRAL distribution becomes available after BLUM bonding/migration."
      },
      {
        id: 8,
        question: "Is vVIRAL the same as real $VIRAL?",
        answer: "No. vVIRAL is an internal platform balance. Real $VIRAL will be distributed later from the project wallet after bonding/migration."
      },
      {
        id: 9,
        question: "How can I earn vVIRAL?",
        answer: "You can earn vVIRAL by completing verified campaign tasks, inviting active users and participating in platform activities."
      },
      {
        id: 10,
        question: "Do new users receive a bonus?",
        answer: "Yes. New verified users receive a starter bonus of 100 vVIRAL."
      },
      {
        id: 11,
        question: "Can I buy $VIRAL?",
        answer: "Yes. Users who want to promote faster can buy $VIRAL and use it as fuel for campaigns and platform actions."
      },
      {
        id: 12,
        question: "How does the referral system work?",
        answer: "You invite users with your unique referral link. You receive 10% of the valid approved earnings of your invited users."
      },
      {
        id: 13,
        question: "Do I receive rewards for fake registrations?",
        answer: "No. Rewards are paid only for valid approved activity. Fake accounts, bots and duplicate users do not generate rewards."
      },
      {
        id: 20,
        question: "How will real $VIRAL be distributed?",
        answer: "After bonding/migration, eligible users may receive real $VIRAL through a controlled claim/drop system from the project wallet."
      },
      {
        id: 21,
        question: "How is the claim calculated?",
        answer: "Claim amount depends on the user’s valid vVIRAL balance, total valid vVIRAL in the system and the available real $VIRAL claim pool."
      },
      {
        id: 27,
        question: "What is Viral Power?",
        answer: "Viral Power is an internal reputation and activity score. It is not a token and cannot be withdrawn."
      },
      {
        id: 28,
        question: "Why do I need Viral Power?",
        answer: "Viral Power helps measure user quality, protect against bots, improve leaderboard ranking and unlock better platform opportunities."
      }
    ]
  },
  {
    category: "Wallets, Fees & Settings",
    items: [
      {
        id: 17,
        question: "What is VIRAL_Fee_wallet?",
        answer: "VIRAL_Fee_wallet is the platform fee wallet. The platform receives 10% from campaign turnover and paid internal actions."
      },
      {
        id: 18,
        question: "Is there burn or lock?",
        answer: "No. The current model does not use burn or lock. The platform collects a 10% fee to VIRAL_Fee_wallet."
      },
      {
        id: 19,
        question: "What is VIRAL_Creator_wallet?",
        answer: "VIRAL_Creator_wallet is the project reserve wallet. The project plans to buy 200,000,000 $VIRAL at the start and may buy more later."
      },
      {
        id: 22,
        question: "Can I connect my wallet?",
        answer: "Yes. TonConnect is mandatory. Users must be able to connect a TON-compatible wallet such as Tonkeeper."
      },
      {
        id: 23,
        question: "Does the app ask for seed phrases?",
        answer: "No. $VIRAL App will never ask for seed phrases, private keys or wallet recovery phrases."
      },
      {
        id: 24,
        question: "Can I send vVIRAL to another user?",
        answer: "Yes. Before bonding, SEND should support internal vVIRAL transfers between users."
      },
      {
        id: 25,
        question: "Can I send real $VIRAL?",
        answer: "Real $VIRAL sending will be available only after bonding/migration and real token distribution are implemented."
      }
    ]
  }
];

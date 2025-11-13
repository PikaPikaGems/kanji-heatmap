import { outLinks } from "@/lib/external-links";
import { BugIcon, KoFiIcon, DiscordIcon } from "../icons";
import { BirdIcon } from "lucide-react";

const bugItem = {
  href: outLinks.githubIssue,
  text: "Report bug on GitHub issues 🐛🐞",
  icon: <BugIcon />,
};

const discordItem = {
  href: outLinks.discord,
  text: "Join our Discord server",
  icon: <DiscordIcon />,
};

const kofiItem = {
  href: outLinks.koFi,
  text: "Motivate us with a Ko-Fi ☕🧋🍵",
  icon: <KoFiIcon />,
};

export const twitterItem = {
  href: outLinks.twitter,
  text: "Follow us on X/Twitter",
  icon: <BirdIcon />,
};

const linksOutItems = {
  bugItem,
  discordItem,
  kofiItem,
  //   twitterItem,
};

export { linksOutItems };

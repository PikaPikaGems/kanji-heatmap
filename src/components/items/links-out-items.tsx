import { outLinks } from "@/lib/external-links";
import { BugIcon, DiscordIcon } from "../icons";
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

export const twitterItem = {
  href: outLinks.twitter,
  text: "Follow us on X/Twitter",
  icon: <BirdIcon />,
};

const linksOutItems = {
  bugItem,
  discordItem,
  twitterItem,
};

export { linksOutItems };

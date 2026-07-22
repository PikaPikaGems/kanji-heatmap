import { outLinks } from "@/lib/external-links";
import { BugIcon, DiscordIcon } from "../icons";
import { BirdIcon, InstagramIcon, Mail } from "lucide-react";

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

export const instagramItem = {
  href: outLinks.instagram,
  text: "Follow us on Instagram",
  icon: <InstagramIcon />,
};

const emailItem = {
  href: outLinks.email,
  text: "Email us",
  icon: <Mail />,
};

const linksOutItems = {
  bugItem,
  discordItem,
  twitterItem,
  instagramItem,
  emailItem,
};

export { linksOutItems };

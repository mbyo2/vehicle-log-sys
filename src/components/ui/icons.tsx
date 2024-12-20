import {
  Loader2,
  LucideProps,
  User,
  Mail,
  Lock,
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  user: User,
  mail: Mail,
  lock: Lock,
};

export type Icon = keyof typeof Icons;
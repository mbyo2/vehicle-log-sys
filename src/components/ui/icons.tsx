
import {
  Loader2,
  LucideProps,
  User,
  Mail,
  Lock,
  RefreshCw,
} from "lucide-react";

export const Icons = {
  spinner: Loader2,
  user: User,
  mail: Mail,
  lock: Lock,
  refresh: RefreshCw,
};

export type Icon = keyof typeof Icons;

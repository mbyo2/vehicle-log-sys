import { Progress } from "@/components/ui/progress";
import { SecurityUtils } from "@/lib/security";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  // Use SecurityUtils for consistent validation
  const validation = SecurityUtils.validatePassword(password);
  const strength = validation.score;
  
  const getStrengthText = (score: number): string => {
    if (score <= 25) return "Weak";
    if (score <= 50) return "Fair";
    if (score <= 75) return "Good";
    return "Strong";
  };

  const getStrengthColor = (score: number): string => {
    if (score <= 25) return "bg-destructive text-destructive-foreground";
    if (score <= 50) return "bg-warning text-warning-foreground";
    if (score <= 75) return "bg-info text-info-foreground";
    return "bg-success text-success-foreground";
  };

  return (
    <div className="space-y-2">
      <Progress value={strength} className={`h-2 ${getStrengthColor(strength)}`} />
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">
          Password strength: {getStrengthText(strength)}
        </p>
        {!validation.isValid && validation.feedback.length > 0 && (
          <div className="text-xs text-destructive">
            <p>Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              {validation.feedback.map((feedback, index) => (
                <li key={index}>{feedback}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive: boolean;
  };
  bgColor?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  bgColor = "bg-calm"
}: StatsCardProps) {
  return (
    <Card className="border border-gray-100">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-primary">{value}</p>
            {trend && (
              <div className="mt-2">
                <span className={`text-sm ${trend.positive ? "text-secondary" : "text-destructive"}`}>
                  {trend.value}
                </span>
              </div>
            )}
            {subtitle && !trend && (
              <div className="mt-2">
                <span className="text-sm text-gray-500">{subtitle}</span>
              </div>
            )}
          </div>
          <div className={`${bgColor} p-3 rounded-full`}>
            <Icon className="text-primary h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { 
    Card, 
    CardContent, 
    CardHeader,
    CardTitle
  } from "@/components/ui/card";
  import { formatPrice } from "@/lib/format";
  
  interface DataCardProps {
    value: number;
    label: string;
    shouldFormat?: boolean;
  }
  
  export const DataCard = ({
    value,
    label,
    shouldFormat,
  }: DataCardProps) => {
    return (
     <Card className="rounded-xl border border-gray-200/70 dark:border-gray-800/70 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-gray-900 dark:text-white">
          {shouldFormat ? formatPrice(value) : value}
        </div>
      </CardContent>
     </Card>
    )
  }

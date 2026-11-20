import { type HTMLAttributes } from "react";
import { Card as UICard } from "@rymel/ui";
import { cn } from "@utils/cn";

/**
 * Tarjeta del sistema de diseño con las subpartes que usa el admin
 * (cabecera, título, descripción, contenido, pie).
 */
export type CardProps = HTMLAttributes<HTMLDivElement>;

const Card = ({ className, ...props }: CardProps) => (
  <UICard as="div" padded={false} className={className} {...props} />
);

const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col gap-1 p-6", className)} {...props} />
);

const CardTitle = ({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={cn(
      "m-0 text-xl font-extrabold leading-tight tracking-[-0.01em] text-gray-900",
      className,
    )}
    {...props}
  />
);

const CardDescription = ({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("m-0 text-sm text-gray-600", className)} {...props} />
);

const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
);

const CardFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
);

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

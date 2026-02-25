import "framer-motion";

// Override motion component types to include className
declare module "framer-motion" {
  interface MotionProps {
    className?: string;
  }
}

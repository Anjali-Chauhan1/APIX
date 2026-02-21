import React from 'react';
import { cn } from '../utils/helpers';

const Card = ({ 
  className, 
  children, 
  hover = false,
  ...props 
}) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl sm:rounded-2xl shadow-card p-2 sm:p-4 md:p-6 transition-all duration-300 w-full min-w-0',
        hover && 'hover:shadow-soft hover:-translate-y-1 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

const CardHeader = ({ className, children, ...props }) => {
  return (
    <div className={cn('mb-2 sm:mb-4', className)} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('text-base sm:text-xl font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  );
};

const CardDescription = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-xs sm:text-sm text-gray-600 mt-1', className)} {...props}>
      {children}
    </p>
  );
};

const CardContent = ({ className, children, ...props }) => {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
};

const CardFooter = ({ className, children, ...props }) => {
  return (
    <div className={cn('mt-4 sm:mt-6 pt-2 sm:pt-4 border-t border-gray-100', className)} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Description = CardDescription;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;

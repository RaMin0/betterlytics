'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Tier, Currency } from '@/entities/billing';
import { formatPrice } from '@/utils/pricing';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { EventRange } from '@/lib/billing/plans';
import { Dispatch } from 'react';

interface PricingCardsProps {
  eventRange: EventRange;
  currency: Currency;
  onPlanSelect?: Dispatch<SelectedPlan>;
  mode?: 'landing' | 'billing';
  className?: string;
  billingData?: UserBillingData;
}

interface PlanConfig {
  tier: Tier;
  price_cents: number;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  popular: boolean;
  lookup_key: string | null;
}

export function PricingCards({
  eventRange,
  currency,
  onPlanSelect,
  mode = 'landing',
  className = '',
  billingData,
}: PricingCardsProps) {
  const growthPrice = currency === 'EUR' ? eventRange.growth.price.eur_cents : eventRange.growth.price.usd_cents;
  const professionalPrice =
    currency === 'EUR' ? eventRange.professional.price.eur_cents : eventRange.professional.price.usd_cents;

  const isFree = growthPrice === 0;
  const isCustom = growthPrice < 0;

  const plans: PlanConfig[] = [
    {
      tier: 'growth',
      price_cents: growthPrice,
      period: !isFree && !isCustom ? '/month' : '',
      description: 'Perfect for small websites and personal projects',
      features: [
        `Up to ${eventRange.label} events/month`,
        'All dashboard & analytics features',
        '1 site',
        '1+ year data retention',
        'Email support',
      ],
      cta: isFree ? 'Get Started for Free' : isCustom ? 'Contact Sales' : 'Get Started',
      popular: false,
      lookup_key: eventRange.growth.lookup_key,
    },
    {
      tier: 'professional',
      price_cents: professionalPrice,
      period: !isCustom ? '/month' : '',
      description: 'Advanced features for growing businesses',
      features: [
        `Up to ${eventRange.label} events/month`,
        'Everything in Starter',
        'Up to 50 sites',
        '3+ years data retention',
        //'Access to API',
        //'Up to 10 team members',
        'Priority support',
      ],
      cta: isCustom ? 'Contact Sales' : 'Get Started',
      popular: true,
      lookup_key: eventRange.professional.lookup_key,
    },
    {
      tier: 'enterprise',
      price_cents: -1,
      period: '',
      description: 'Complete solution for large organizations',
      features: [
        'Everything in Professional',
        'Unlimited sites',
        '5+ years data retention',
        //'Unlimited team members',
        'Dedicated support & help',
        'SLA guarantee',
      ],
      cta: 'Contact Us',
      popular: false,
      lookup_key: null,
    },
  ];

  const handlePlanClick = (plan: PlanConfig) => {
    if (mode === 'billing' && onPlanSelect) {
      const selectedPlan: SelectedPlan = {
        tier: plan.tier,
        eventLimit: eventRange.value,
        price_cents: plan.price_cents,
        period: plan.period,
        currency,
        lookup_key: plan.lookup_key,
      };
      onPlanSelect(selectedPlan);
    }
  };

  const formatDisplayPrice = (price: number): string => {
    if (price === 0) return 'Free';
    if (price < 0) return 'Custom';
    return formatPrice(price, currency);
  };

  const renderButton = (plan: PlanConfig) => {
    if (mode === 'billing' && billingData) {
      const isCurrentPlan =
        billingData.subscription.tier === plan.tier && billingData.subscription.eventLimit === eventRange.value;

      let buttonText = plan.cta;
      let buttonVariant: 'default' | 'outline' | 'secondary' = plan.popular ? 'default' : 'outline';
      let isDisabled = false;

      if (isCurrentPlan) {
        buttonText = 'Current Plan';
        buttonVariant = 'secondary';
        isDisabled = true;
      } else if (plan.tier === 'enterprise') {
        buttonText = 'Contact Sales';
      } else if (plan.tier === 'growth' && plan.price_cents === 0) {
        buttonText = 'Get Started for Free';
        isDisabled = true;
      } else if (billingData.isExistingPaidSubscriber) {
        buttonText = 'Change to This Plan';
      } else {
        buttonText = plan.cta;
      }

      return (
        <Button
          className='mt-auto w-full cursor-pointer'
          variant={buttonVariant}
          onClick={() => handlePlanClick(plan)}
          disabled={isDisabled}
        >
          {buttonText}
        </Button>
      );
    }

    const href = plan.cta.toLowerCase().includes('get started') ? '/register' : '/contact';

    return (
      <Link href={href} className='w-full'>
        <Button className='mt-auto w-full cursor-pointer' variant={plan.popular ? 'default' : 'outline'}>
          {plan.cta}
        </Button>
      </Link>
    );
  };

  return (
    <div className={`mx-auto grid max-w-6xl gap-8 md:grid-cols-3 ${className}`}>
      {plans.map((plan) => (
        <Card
          key={plan.tier}
          className={`dark:metric-card relative flex flex-col ${plan.popular ? 'dark:shadow-card-glow border-primary/50' : ''}`}
        >
          {plan.popular && (
            <Badge className='bg-primary absolute -top-3 left-1/2 -translate-x-1/2 transform'>Most Popular</Badge>
          )}
          {billingData &&
            billingData.subscription.tier === plan.tier &&
            billingData.subscription.eventLimit === eventRange.value && (
              <Badge variant='secondary' className='absolute -bottom-3 left-1/2 -translate-x-1/2 transform'>
                Current
              </Badge>
            )}
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{capitalizeFirstLetter(plan.tier)}</CardTitle>
            <div className='mt-4'>
              <span className='text-4xl font-bold'>{formatDisplayPrice(plan.price_cents)}</span>
              {plan.period && <span className='text-muted-foreground text-lg'>{plan.period}</span>}
            </div>
            <CardDescription className='mt-2'>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-grow flex-col'>
            <ul className='mb-6 flex-grow space-y-3'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex items-center'>
                  <Check className='text-primary mr-3 h-4 w-4 flex-shrink-0' />
                  <span className='text-sm'>{feature}</span>
                </li>
              ))}
            </ul>
            {renderButton(plan)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

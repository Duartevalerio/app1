
-- Create betting_accounts table
CREATE TABLE public.betting_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  fixed_stake_value NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create betting_operations table
CREATE TABLE public.betting_operations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES public.betting_accounts(id) ON DELETE CASCADE NOT NULL,
  orbit_value NUMERIC NOT NULL,
  gain_value NUMERIC NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('Standard Bet', 'Freebet')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create financial_tracker table
CREATE TABLE public.financial_tracker (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  entry_date DATE NOT NULL,
  profit NUMERIC DEFAULT 0,
  withdrawal NUMERIC DEFAULT 0,
  UNIQUE(user_id, entry_date)
);

-- Create verification_accounts table
CREATE TABLE public.verification_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  verification_status TEXT NOT NULL DEFAULT 'Not Verified' CHECK (verification_status IN ('Not Verified', 'Pending', 'Verified')),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_financial_summary table
CREATE TABLE public.user_financial_summary (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  bankroll NUMERIC DEFAULT 0
);

-- Enable Row Level Security on all tables
ALTER TABLE public.betting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.betting_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_tracker ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_financial_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policies for betting_accounts
CREATE POLICY "Users can view their own betting accounts" 
  ON public.betting_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own betting accounts" 
  ON public.betting_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own betting accounts" 
  ON public.betting_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own betting accounts" 
  ON public.betting_accounts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Security definer function to check if user owns betting account
CREATE OR REPLACE FUNCTION public.user_owns_betting_account(account_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.betting_accounts 
    WHERE id = account_id AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for betting_operations
CREATE POLICY "Users can view operations of their own accounts" 
  ON public.betting_operations 
  FOR SELECT 
  USING (public.user_owns_betting_account(account_id));

CREATE POLICY "Users can create operations for their own accounts" 
  ON public.betting_operations 
  FOR INSERT 
  WITH CHECK (public.user_owns_betting_account(account_id));

CREATE POLICY "Users can update operations of their own accounts" 
  ON public.betting_operations 
  FOR UPDATE 
  USING (public.user_owns_betting_account(account_id));

CREATE POLICY "Users can delete operations of their own accounts" 
  ON public.betting_operations 
  FOR DELETE 
  USING (public.user_owns_betting_account(account_id));

-- RLS Policies for financial_tracker
CREATE POLICY "Users can view their own financial records" 
  ON public.financial_tracker 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial records" 
  ON public.financial_tracker 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial records" 
  ON public.financial_tracker 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial records" 
  ON public.financial_tracker 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for verification_accounts
CREATE POLICY "Users can view their own verification accounts" 
  ON public.verification_accounts 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own verification accounts" 
  ON public.verification_accounts 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own verification accounts" 
  ON public.verification_accounts 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own verification accounts" 
  ON public.verification_accounts 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for user_financial_summary
CREATE POLICY "Users can view their own financial summary" 
  ON public.user_financial_summary 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own financial summary" 
  ON public.user_financial_summary 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own financial summary" 
  ON public.user_financial_summary 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own financial summary" 
  ON public.user_financial_summary 
  FOR DELETE 
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  amount numeric(10,2) NOT NULL,
  description text,
  payment_id text,
  status text DEFAULT 'success',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own transactions') THEN
    CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow insert on transactions') THEN
    CREATE POLICY "Allow insert on transactions" ON public.transactions FOR ALL TO public USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.add_wallet_balance(
  p_user_id uuid,
  p_amount numeric,
  p_payment_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
  current_balance numeric;
  new_balance numeric;
begin
  IF NOT EXISTS (SELECT 1 FROM public.wallet WHERE user_id = p_user_id) THEN
    INSERT INTO public.wallet (user_id, balance, currency, created_at, updated_at)
    VALUES (p_user_id, p_amount, 'INR', now(), now());
    new_balance := p_amount;
  ELSE
    SELECT balance INTO current_balance FROM public.wallet WHERE user_id = p_user_id FOR UPDATE;
    new_balance := coalesce(current_balance, 0) + p_amount;
    
    UPDATE public.wallet
    SET balance = new_balance, updated_at = now()
    WHERE user_id = p_user_id;
  END IF;

  INSERT INTO public.transactions (user_id, type, amount, description, payment_id, status, created_at)
  VALUES (p_user_id, 'credit', p_amount, 'PayU Wallet Top-up', p_payment_id, 'success', now());

  RETURN json_build_object('success', true, 'new_balance', new_balance);
end;
$$;

-- Also immediately credit the 10.00 for user 3033941d-14c9-4201-ac76-ef4d039813e0 that succeeded earlier!
SELECT public.add_wallet_balance('3033941d-14c9-4201-ac76-ef4d039813e0'::uuid, 10.00, 'tx_1793026017123_7487');

-- Unit 4: first hand-verified dish.
-- Sources reviewed:
-- https://kokiafrique.com/en/dishes/egusi-soup/
-- https://www.foodnetwork.com/recipes/food-network-kitchen/egusi-stew-12347892
-- https://mynigerianfood.co.uk/nigerian-recipes/nigerian-soups/egusi-soup
-- https://www.bmc.org/recipes/egusi-soup

do $$
declare
  egusi_id uuid;
begin
  insert into public.dish_cache (dish_name, verified)
  values ('Egusi soup', true)
  on conflict (dish_name) do update set verified = true
  returning id into egusi_id;

  if not exists (select 1 from public.dish_ingredients where dish_cache_id = egusi_id) then
    insert into public.dish_ingredients (dish_cache_id, ingredient, tier, allergen_category, regional_note)
    values
      (egusi_id, 'ground egusi (melon seed)', 'always', 'none', 'The defining seed ingredient of egusi soup.'),
      (egusi_id, 'palm oil', 'commonly', 'none', 'Common across the reviewed Nigerian recipes, with preparation and quantity varying.'),
      (egusi_id, 'leafy greens', 'commonly', 'none', 'Spinach, bitter leaf, uziza, or another local green may be used.'),
      (egusi_id, 'crayfish or dried shrimp', 'sometimes', 'shellfish', 'Common in many versions, but the cook may use another stock or leave it out.'),
      (egusi_id, 'stockfish or dried fish', 'sometimes', 'none', 'Fish choices vary by household and region.'),
      (egusi_id, 'seasoning or bouillon', 'sometimes', 'none', 'Brand and recipe vary; ask the cook which seasoning was used.');
  end if;
end $$;

-- Units 14-15: two additional hand-reviewed Nigerian dishes.
-- Jollof sources:
-- https://www.foodnetwork.com/recipes/food-network-kitchen/nigerian-jollof-rice-19493519
-- https://www.nigerianfoodtv.com/jollof-rice-how-to-cook-nigerian-jollof/
-- Moin Moin sources:
-- https://www.nigerianfoodtv.com/nigerian-moi-moi-how-to-make-nigerian/
-- https://lounje.ng/recipes/cookbook-002
-- https://kokiafrique.com/en/dishes/moi-moi/

do $$
declare
  dish_id uuid;
begin
  insert into public.dish_cache (dish_name, verified)
  values ('Jollof rice', true)
  on conflict (dish_name) do update set verified = true
  returning id into dish_id;

  if not exists (select 1 from public.dish_ingredients where dish_cache_id = dish_id) then
    insert into public.dish_ingredients (dish_cache_id, ingredient, tier, allergen_category, regional_note)
    values
      (dish_id, 'long-grain parboiled rice', 'always', 'none', 'The rice is cooked directly in the pepper and tomato stew.'),
      (dish_id, 'tomato and red pepper stew', 'always', 'none', 'The base gives Nigerian jollof its characteristic color and flavor.'),
      (dish_id, 'cooking oil', 'commonly', 'none', 'Oil type and quantity vary between home and party recipes.'),
      (dish_id, 'onion and seasoning', 'commonly', 'none', 'The aromatics and spice mix vary by cook and household.'),
      (dish_id, 'broth or bouillon', 'sometimes', 'none', 'Some recipes use broth or bouillon; others season with water and spices.');
  end if;

  insert into public.dish_cache (dish_name, verified)
  values ('Moin moin', true)
  on conflict (dish_name) do update set verified = true
  returning id into dish_id;

  if not exists (select 1 from public.dish_ingredients where dish_cache_id = dish_id) then
    insert into public.dish_ingredients (dish_cache_id, ingredient, tier, allergen_category, regional_note)
    values
      (dish_id, 'steamed blended beans', 'always', 'none', 'Moin moin is a steamed bean pudding made from blended beans.'),
      (dish_id, 'pepper and onion', 'commonly', 'none', 'The pepper blend and quantity vary by recipe.'),
      (dish_id, 'vegetable oil', 'commonly', 'none', 'Oil is commonly mixed into the batter, with recipe variation.'),
      (dish_id, 'crayfish or dried shrimp', 'sometimes', 'shellfish', 'A common enrichment in many versions, but not used in every batch.'),
      (dish_id, 'boiled egg filling', 'sometimes', 'egg', 'Egg is a frequent filling, but other batches use fish, meat, or no filling.');
  end if;
end $$;

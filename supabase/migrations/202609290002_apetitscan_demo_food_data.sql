-- Unit 3: manually reviewed data for the two ApetitScan demo plates.
-- All carbohydrate ranges below are derived from referenced per-100 g values
-- and explicit serving-weight bands. They are not model-generated values.
-- No GI category is assigned because the sources reviewed do not provide a
-- matching GI value for these exact food/preparation entries.

insert into public.foods (name, category, is_main_carb, verified)
values
  ('white rice', 'carb_staple', true, true),
  ('plantain', 'carb_staple', true, true),
  ('tomato stew', 'stew_soup', false, true),
  ('chicken', 'protein', false, true),
  ('vegetables', 'vegetable', false, true),
  ('fish', 'protein', false, true)
on conflict (name) do nothing;

with seed(food_name, preparation, portion_size, carbs_low_g, carbs_high_g, source_note, entry_confidence) as (
  values
    ('white rice', 'boiled', 'small', 32.0, 46.1,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 01_038: cooked white rice, 30.0 g available carbohydrate plus 2.0 g fibre per 100 g; total carbohydrate density used here is 32.0 g/100 g. Range scaled to a 100-144 g photo-tier serving band. Serving reference: Nigerian school food study reports mean white-rice portions of 213-239 g across age groups; lower bands are intentionally retained for smaller visible servings. https://www.fao.org/4/i2698b/i2698b00.pdf ; https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 85),
    ('white rice', 'boiled', 'medium', 46.4, 59.2,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 01_038: cooked white rice, 30.0 g available carbohydrate plus 2.0 g fibre per 100 g; total carbohydrate density used here is 32.0 g/100 g. Range scaled to a 145-185 g photo-tier serving band. Serving reference: Nigerian school food study reports mean white-rice portions of 213-239 g across age groups; the photo tiers are approximate visual servings, not measured weights. https://www.fao.org/4/i2698b/i2698b00.pdf ; https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 85),
    ('white rice', 'boiled', 'large', 59.5, 83.2,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 01_038: cooked white rice, 30.0 g available carbohydrate plus 2.0 g fibre per 100 g; total carbohydrate density used here is 32.0 g/100 g. Range scaled to a 186-260 g photo-tier serving band, spanning the observed Nigerian school-study mean of 213-239 g. Visual tiers are approximate and must not be presented as exact weights. https://www.fao.org/4/i2698b/i2698b00.pdf ; https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 85),

    ('plantain', 'boiled', 'small', 4.6, 7.4,
      'Nigeria Food Composition Table (2017), boiled ripe plantain: 18.4 g carbohydrate/100 g edible portion, as indexed with the table values by FitNigerian. Scaled to an approximate 25-40 g visible-serving band. Portion reference: plantain intake averaged 51.9 g per consumer/day in an Ibadan child nutrition study; bands are visual approximations. https://www.fitnigerian.com/nutrition-facts/boiled-plantain-ripe/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),
    ('plantain', 'boiled', 'medium', 7.5, 12.0,
      'Nigeria Food Composition Table (2017), boiled ripe plantain: 18.4 g carbohydrate/100 g edible portion, as indexed with the table values by FitNigerian. Scaled to an approximate 41-65 g visible-serving band around the 51.9 g/day Nigerian study intake reference. https://www.fitnigerian.com/nutrition-facts/boiled-plantain-ripe/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),
    ('plantain', 'boiled', 'large', 12.1, 18.4,
      'Nigeria Food Composition Table (2017), boiled ripe plantain: 18.4 g carbohydrate/100 g edible portion, as indexed with the table values by FitNigerian. Scaled to an approximate 66-100 g visible-serving band. Portion weights are model assumptions for visual tiers, not measured values from a plate image. https://www.fitnigerian.com/nutrition-facts/boiled-plantain-ripe/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),
    ('plantain', 'fried', 'small', 12.0, 19.2,
      'Nigeria Food Composition Table (2017), dodo (ripe plantain fried in palm oil): 48.0 g carbohydrate/100 g edible portion, indexed with the table values by FitNigerian. Scaled to an approximate 25-40 g visible-serving band. This same-source comparison with boiled plantain (18.4 g/100 g) captures the preparation difference for the demo. https://www.fitnigerian.com/nutrition-facts/fried-plantain-dodo/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),
    ('plantain', 'fried', 'medium', 19.6, 31.2,
      'Nigeria Food Composition Table (2017), dodo (ripe plantain fried in palm oil): 48.0 g carbohydrate/100 g edible portion, indexed with the table values by FitNigerian. Scaled to an approximate 41-65 g visible-serving band around the 51.9 g/day Nigerian study intake reference. https://www.fitnigerian.com/nutrition-facts/fried-plantain-dodo/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),
    ('plantain', 'fried', 'large', 31.6, 48.0,
      'Nigeria Food Composition Table (2017), dodo (ripe plantain fried in palm oil): 48.0 g carbohydrate/100 g edible portion, indexed with the table values by FitNigerian. Scaled to an approximate 66-100 g visible-serving band. Visual tiers are approximate; frying oil and ripeness vary by recipe. https://www.fitnigerian.com/nutrition-facts/fried-plantain-dodo/ ; https://pmc.ncbi.nlm.nih.gov/articles/PMC8747053/', 72),

    ('tomato stew', 'cooked', 'small', 14.1, 28.2,
      'Ayogu et al., Food and Nutrition Bulletin (2017), measured Nigerian tomato stew composition: 28.2 g carbohydrate/100 g (carbohydrate by difference); recipe contains tomatoes, meat/fish, oil, greens, and onions. Scaled to an approximate 50-100 g visible-serving band. This is one regional recipe and stew composition varies substantially by household. https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 68),
    ('tomato stew', 'cooked', 'medium', 28.4, 43.8,
      'Ayogu et al., Food and Nutrition Bulletin (2017), measured Nigerian tomato stew composition: 28.2 g carbohydrate/100 g (carbohydrate by difference); recipe contains tomatoes, meat/fish, oil, greens, and onions. Scaled to an approximate 101-155 g band, close to reported mean stew portions of 128-153 g in the same Nigerian study. Household recipes vary. https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 68),
    ('tomato stew', 'cooked', 'large', 43.9, 63.5,
      'Ayogu et al., Food and Nutrition Bulletin (2017), measured Nigerian tomato stew composition: 28.2 g carbohydrate/100 g (carbohydrate by difference); recipe contains tomatoes, meat/fish, oil, greens, and onions. Scaled to an approximate 156-225 g visible-serving band. Recipe concentration varies, so the app must ask when the food does not match this tomato-stew preparation. https://journals.sagepub.com/doi/pdf/10.1177/0379572116689627?download=true', 68),

    ('chicken', 'boiled', 'small', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_034: plain boiled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),
    ('chicken', 'boiled', 'medium', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_034: plain boiled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),
    ('chicken', 'boiled', 'large', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_034: plain boiled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),
    ('chicken', 'grilled', 'small', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_035: plain grilled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),
    ('chicken', 'grilled', 'medium', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_035: plain grilled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),
    ('chicken', 'grilled', 'large', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 07_035: plain grilled skinless chicken breast has 0 g available carbohydrate and 0 g fibre per 100 g. Plain chicken only; any coating or sauce is a separate component. https://www.fao.org/4/i2698b/i2698b00.pdf', 82),

    ('vegetables', 'boiled', 'small', 1.5, 2.9,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 04_024: boiled amaranth leaves, 4.8 g available carbohydrate plus 1.5 g fibre per 100 g; total carbohydrate density used is 6.3 g/100 g. Used as a leafy-green proxy for the demo vegetables, scaled to a 25-45 g band. Ask or disclose the proxy if the identified vegetables are not leafy greens. https://www.fao.org/4/i2698b/i2698b00.pdf', 65),
    ('vegetables', 'boiled', 'medium', 2.8, 4.5,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 04_024: boiled amaranth leaves, 4.8 g available carbohydrate plus 1.5 g fibre per 100 g; total carbohydrate density used is 6.3 g/100 g. Used as a leafy-green proxy for the demo vegetables, scaled to a 46-70 g band. Ask or disclose the proxy if the identified vegetables are not leafy greens. https://www.fao.org/4/i2698b/i2698b00.pdf', 65),
    ('vegetables', 'boiled', 'large', 4.4, 7.0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entry 04_024: boiled amaranth leaves, 4.8 g available carbohydrate plus 1.5 g fibre per 100 g; total carbohydrate density used is 6.3 g/100 g. Used as a leafy-green proxy for the demo vegetables, scaled to a 71-110 g band. Ask or disclose the proxy if the identified vegetables are not leafy greens. https://www.fao.org/4/i2698b/i2698b00.pdf', 65),

    ('fish', 'steamed', 'small', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78),
    ('fish', 'steamed', 'medium', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78),
    ('fish', 'steamed', 'large', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78),
    ('fish', 'grilled', 'small', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78),
    ('fish', 'grilled', 'medium', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78),
    ('fish', 'grilled', 'large', 0, 0,
      'FAO/INFOODS West Africa Food Composition Table (2019), entries 09_019-09_020: plain steamed or grilled catfish each have 0 g available carbohydrate and 0 g fibre per 100 g. Catfish is used as the demo fish proxy; sauces and breading are not included. https://www.fao.org/4/i2698b/i2698b00.pdf', 78)
)
insert into public.food_nutrition (
  food_id, preparation, portion_size, carbs_low_g, carbs_high_g,
  gi_category, gi_source, source_note, entry_confidence
)
select
  foods.id,
  seed.preparation,
  seed.portion_size,
  seed.carbs_low_g,
  seed.carbs_high_g,
  null,
  null,
  seed.source_note,
  seed.entry_confidence
from seed
join public.foods on foods.name = seed.food_name
on conflict (food_id, preparation, portion_size) do nothing;

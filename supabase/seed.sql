-- Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'Role') THEN
    CREATE TYPE "Role" AS ENUM ('CLIENT','CHEF');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MealType') THEN
    CREATE TYPE "MealType" AS ENUM (
      'BREAKFAST','LUNCH','DINNER','SNACK','SIDE_DISH','SALAD','SOUP','PASTA',
      'BOWL','SANDWICH','TACO','CURRY','CASSEROLE','STIR_FRY','ROAST','SEAFOOD',
      'DESSERT','DRINK_ALCOHOLIC','DRINK_NON_ALCOHOLIC'
    );
  END IF;
END
$$;

-- Tables: create if missing
CREATE TABLE IF NOT EXISTS "User" (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role "Role" NOT NULL DEFAULT 'CLIENT',
  allergies TEXT,
  preferences TEXT,
  "questionnaireData" TEXT,
  notes TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS "Recipe" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT,
  "cookbookName" TEXT,
  "recipeLink" TEXT,
  "pageNumber" TEXT,
  "prepTime" INTEGER,
  "cookTime" INTEGER,
  servings INTEGER,
  "mealType" "MealType" NOT NULL DEFAULT 'DINNER',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Ingredient" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT,
  unit TEXT,
  "recipeId" TEXT NOT NULL,
  CONSTRAINT ingredient_recipe_fk FOREIGN KEY ("recipeId") REFERENCES "Recipe"(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "WeeklyMenu" (
  id TEXT PRIMARY KEY,
  "weekStart" TIMESTAMPTZ NOT NULL,
  title TEXT,
  "clientId" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT weeklymenu_client_fk FOREIGN KEY ("clientId") REFERENCES "User"(id)
);

CREATE TABLE IF NOT EXISTS "MenuItem" (
  id TEXT PRIMARY KEY,
  "menuId" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "dayOfWeek" INTEGER NOT NULL,
  "mealType" "MealType" NOT NULL,
  approved BOOLEAN,
  "clientNote" TEXT,
  CONSTRAINT menuitem_menu_fk FOREIGN KEY ("menuId") REFERENCES "WeeklyMenu"(id) ON DELETE CASCADE,
  CONSTRAINT menuitem_recipe_fk FOREIGN KEY ("recipeId") REFERENCES "Recipe"(id)
);

CREATE TABLE IF NOT EXISTS "MealFeedback" (
  id TEXT PRIMARY KEY,
  "menuItemId" TEXT UNIQUE NOT NULL,
  "clientId" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  favorited BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT mealfeedback_menuitem_fk FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"(id) ON DELETE CASCADE,
  CONSTRAINT mealfeedback_client_fk FOREIGN KEY ("clientId") REFERENCES "User"(id),
  CONSTRAINT mealfeedback_recipe_fk FOREIGN KEY ("recipeId") REFERENCES "Recipe"(id)
);

-- INSERTs from local dev.db (filtered)
INSERT INTO "User" VALUES('cmqfpokly00000bo81hz5kbhb','chef@chefandco.com','Chef Alex','$2b$12$0TxA7hURBbowKRvCK16QaOw194txINtal7.sSF38c72JGtFia4Ldm','CHEF',NULL,NULL,NULL,'2026-06-15T21:14:40.342+00:00','2026-06-15T21:14:40.342+00:00',NULL);
INSERT INTO "User" VALUES('cmqfpokrx00010bo8cbq6yhoe','jane@example.com','Jane Smith','$2b$12$fJIijtHjhLCBuChdGzrqNuXMj/sKgY1uPObMLsNl5.fzgUQ1874DC','CLIENT','Tree nuts, shellfish','Mediterranean food, vegetarian-friendly, low-carb options',NULL,'2026-06-15T21:14:40.557+00:00','2026-06-15T21:14:40.557+00:00',NULL);
INSERT INTO "Recipe" VALUES('cmqfqghsj0000luo8ugd0ftzf','Grilled Peaches and Runner Beans',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-15T21:36:23.059+00:00','2026-06-15T21:36:23.059+00:00','Ottolenghi FLAVOR','37',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqfqnfo9000bluo8zm4j1o63','Iceberg Wedges with Smoky Eggplant Cream',NULL,NULL,NULL,4,'SALAD','2026-06-15T21:41:46.905+00:00','2026-06-15T21:52:24.585+00:00','Ottolenghi FLAVOR','38',NULL,'vegetarian');
INSERT INTO "Recipe" VALUES('cmqfqscdb000yluo8f4yeth1f','Butter Beans in Smokes Cascabel Oil',NULL,NULL,NULL,6,'SNACK','2026-06-15T21:45:35.903+00:00','2026-06-15T21:45:35.903+00:00','Ottolenghi FLAVOR','41',NULL,'vegetarian, vegan, gluten free, dairy free, nut free');
INSERT INTO "Recipe" VALUES('cmqgo7jt50018ono8ir2axdyt','Herb and Charred Eggplant Soup',NULL,NULL,NULL,4,'SOUP','2026-06-16T13:21:12.713+00:00','2026-06-16T13:21:12.713+00:00','Ottolenghi FLAVOR','42',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgodoql001rono8djdu64mo','Pointed Cabbage with Nam Prik',NULL,NULL,NULL,6,'SIDE_DISH','2026-06-16T13:25:59.037+00:00','2026-06-16T13:25:59.037+00:00','Ottolenghi FLAVOR','44',NULL,'vegan, vegetarian, gluten-free');
INSERT INTO "Recipe" VALUES('cmqgohftf0026ono8uzt0r7ob','Steamed Eggplants with Charred Chile Salsa',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T13:28:54.099+00:00','2026-06-16T13:28:54.099+00:00','Ottolenghi FLAVOR','45',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgolb04002kono8adqt108j','Slow-Cooked Charred Green Beans',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T13:31:54.484+00:00','2026-06-16T13:31:54.484+00:00','Ottolenghi FLAVOR','49',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgoqkmj002zono8bqdm8m0d','Hasselback Beets with Lime Leaf Butter',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T13:36:00.235+00:00','2026-06-16T13:36:00.235+00:00','Ottolenghi FLAVOR','50',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgoxc0s003kono8n6xz7hpi','Roasted and Pickled Celery Root with Sweet Chile Dressing',NULL,NULL,NULL,2,'ROAST','2026-06-16T13:41:15.676+00:00','2026-06-16T13:41:15.676+00:00','Ottolenghi FLAVOR','55',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgq46mt0045ono80179l557','Cabbage "Tacos" with Celery Root and Date Barbecue Sauce',NULL,NULL,NULL,16,'TACO','2026-06-16T14:14:34.901+00:00','2026-06-16T14:14:34.901+00:00','Ottolenghi FLAVOR','59',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgqn84y004tono88f5j1fr4','Celery Root Steaks with Café de Paris Sauce',NULL,NULL,NULL,4,'ROAST','2026-06-16T14:29:23.315+00:00','2026-06-16T14:29:23.315+00:00','Ottolenghi FLAVOR','60',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgqu3hj005fono8fati506o','Spiced Plantain with Coconut, Apple, and Ginger Salad',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T14:34:43.879+00:00','2026-06-16T14:34:43.879+00:00','Ottolenghi FLAVOR','62',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgwxfi3005wono8u3lcjbgi','Curry-Crusted Rutabaga Steaks',NULL,NULL,NULL,4,'DINNER','2026-06-16T17:25:17.115+00:00','2026-06-16T17:25:17.115+00:00','Ottolenghi FLAVOR','63',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgx1di4006gono8gjnb0wnj','Curried Carrot Mash with brown Butter',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T17:28:21.148+00:00','2026-06-16T17:28:21.148+00:00','Ottolenghi FLAVOR','67',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgx5xuc006xono8udiuqr2a','Barley, Tomato, and Watercress Stew',NULL,NULL,NULL,4,'SOUP','2026-06-16T17:31:54.132+00:00','2026-06-16T17:31:54.132+00:00','Ottolenghi FLAVOR','68',NULL,'gluten free, pescatarian ');
INSERT INTO "Recipe" VALUES('cmqgx9rxi007fono8xyc3wy45','Lime and Coconut Potato Gratin',NULL,NULL,NULL,6,'SIDE_DISH','2026-06-16T17:34:53.094+00:00','2026-06-16T17:34:53.094+00:00','Ottolenghi FLAVOR','72',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgxduxz007vono81o23pmla','Bkeila, Potato, and Butter Bean Stew',NULL,NULL,NULL,4,'SOUP','2026-06-16T17:38:03.623+00:00','2026-06-16T17:38:03.623+00:00','Ottolenghi FLAVOR','75',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqgxf4z8008cono8n2bbof18','White Bean Mash with Garlic Aioli',NULL,NULL,NULL,6,'SIDE_DISH','2026-06-16T17:39:03.284+00:00','2026-06-16T17:41:05.655+00:00','Ottolenghi FLAVOR','76',NULL,'pescatarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgy7cb3008tono8xc09t6cb','Hummus with Lemon, Fried Garlic, and Chile',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-16T18:00:59.151+00:00','2026-06-16T18:00:59.151+00:00','Ottolenghi FLAVOR','79',NULL,'vegetarian, gluten free, vegan');
INSERT INTO "Recipe" VALUES('cmqgyqy1u0099ono8prnygjp9','Melon and Buffalo Mozzarella Salad with Kasha and Curry Leaves',NULL,NULL,NULL,4,'SALAD','2026-06-16T18:16:13.794+00:00','2026-06-16T18:16:13.794+00:00','Ottolenghi FLAVOR','80',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqgz9hzr009kono8u8gk8cv0','Chilled Avocado Soup with Crunchy Garlic Oil',NULL,NULL,NULL,4,'SOUP','2026-06-16T18:30:39.447+00:00','2026-06-16T18:30:39.447+00:00','Ottolenghi FLAVOR','82',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqhbjaaq009yono8hzou65ig','Pappa al Pomodoro with Lime and Mustard Seeds',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-17T00:14:11.426+00:00','2026-06-17T00:14:11.426+00:00','Ottolenghi FLAVOR','85',NULL,'vegetarian, vegan');
INSERT INTO "Recipe" VALUES('cmqi2tpws00aeono8b73kl28h','Black Beans with Coconut, Chile, and Lime',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-17T12:58:07.852+00:00','2026-06-17T12:58:15.783+00:00','Ottolenghi FLAVOR','86',NULL,'vegetarian, vegan, gluten free');
INSERT INTO "Recipe" VALUES('cmqi2wuj400b9ono8qhcg7m34','Oven Fries with Curry Leaf Mayonnaise',NULL,NULL,NULL,4,'SIDE_DISH','2026-06-17T13:00:33.808+00:00','2026-06-17T13:00:33.808+00:00','Ottolenghi FLAVOR','89',NULL,'vegetarian, gluten free');
INSERT INTO "Recipe" VALUES('cmqi353rk00bkono8fn3fptqd','Chickpea Pancakes with Mango Pickle Yogurt',NULL,NULL,NULL,4,'BREAKFAST','2026-06-17T13:06:59.024+00:00','2026-06-17T13:06:59.024+00:00','Ottolenghi FLAVOR','91',NULL,'vegetarian, gluten free');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0001luo8igdz2f0d','runner beans','14','oz','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0002luo89u8h2bv3','olive oil','3','tbsp','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0003luo8f7n0zefr','flaked sea salt','1','pinch','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0004luo87ie0jg8l','peaches','2','whole','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0005luo887d84dmg','mint leaves','1/4','cup','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0006luo8gaki5nbd','lemon juice','2','tsp','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0007luo8rvb2ygs2','black pepper','1','pinch','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0008luo886nnqfw5','creamy goat cheese','3','oz','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk0009luo8a2xv17nv','roasted and salted almonds','2','tbsp','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqghsk000aluo86bd417r8','honey','2','tsp','cmqfqghsj0000luo8ugd0ftzf');
INSERT INTO "Ingredient" VALUES('cmqfqscdc000zluo82dcxr483','dried cascabel chiles','4','whole','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0010luo85kzs8ju4','garlic','5','cloves','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0011luo83ayvwcxw','jalapeños','2','whole','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0012luo87rjlfewp','lime','1','whole','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0013luo8stn64sia','lemon','1','whole','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0014luo85uxclv01','coriander seeds','1 1/2','tsp','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0015luo8hfjgwf64','cumin seeds','1','tsp','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0016luo8i1ooub7a','olive oil','1 1/2','cup','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0017luo8ks2ckpw6','flaked sea salt','2','tsp','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfqscdc0018luo8ngjvp9of','large butter beans','700','g','cmqfqscdb000yluo8f4yeth1f');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000mono8wv1fm14z','eggplants','2','whole','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000nono85euqmbgx','lemon juice','7 1/2','tsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000oono86f6lvca2','garlic','1','clove','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000pono8ermsi47g','greek yogurt','3','tbsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000qono8gbxx771c','dijon mustard','2','tsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000rono8kp7xhk13','olive oil','1/4','cup','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000sono8rcjpc7zn','table salt','1/2 ','tsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000tono8oe0nhod9','black pepper','1','pinch','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000uono8wykx45zr','olive oil','1 ','tbsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000vono8m3ry4ln7','almonds','1/2','cup','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000wono8w81ga9s8','sourdough bread','3 1/2','oz','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000xono8fd8ht7s2','pumpkin seeds','1/3','cup','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000yono8uxjuptcm','table salt','1/4','tsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm000zono8r10stqup','Urfa Chile flakes','1/2','tsp','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0010ono8spaq25jf','iceberg lettuce','1','head','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0011ono8whhllr9d','olive oil','1/4','cup','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0012ono856u2v64m','salt','1 ','pinch','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0013ono8jgyzwlb6','black pepper','1','pinch','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0014ono8jyn6aqqb','Parmesan','1','oz','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0015ono82982qt3e','rainbow radishes','1 1/2','oz','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0016ono837uafqoa','avocados','2','whole','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqfr13pm0017ono8erq7ypz8','chives','1/4','oz','cmqfqnfo9000bluo8zm4j1o63');
INSERT INTO "Ingredient" VALUES('cmqgo7jt60019ono8msjtoqrh','eggplants','3','whole','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001aono8nu245ra0','lemon juice','3','tbsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001bono8ghx3y4zu','table salt','1','pinch','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001cono8ogg8i4ja','black pepper','1','pinch','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001dono81lbzvmt1','olive oil','7','tbsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001eono855v76feg','yellow onions','2','whole','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001fono82u6ph4zu','garlic','6','cloves','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001gono8e60326bp','parsley','3','cups','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001hono8c9ywet4o','dill','2','cups','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001iono89jefz1c2','green onions','7','whole','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001jono8xh50q8t0','water','3','tbsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001kono8ykr42fr3','ground cinnamon','2 1/2','tsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001lono83iga1t3c','ground cumin','2 1/2','tsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001mono8k9p5ok5e','ground turmeric','1 1/8','tsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001nono8mb1zj19h','baby spinach','9 1/2','cups','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001oono8k6x1vhvy','vegetable stock','2','cups','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001pono8pbku5f8p','red Chile','1','whole','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgo7jt6001qono8byzp1ca0','black mustard seeds','2','tsp','cmqgo7jt50018ono8ir2axdyt');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001sono89c3buqx9','fresh galangal','3/4','oz','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001tono80xu23ylm','garlic','1','clove','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001uono8g6qhxb64','fish sauce','1','tbsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001vono8abf76wcv','Aleppo Chile flakes','1 1/2','tsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001wono89h7ngc8q','tamarind paste','1','tbsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001xono8hvbbtnhh','light brown sugar','1 1/4','tsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001yono8u32hu93t','cherry tomatoes','1 1/4','oz','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn001zono88wzjcu4v','sunflower oil','1','tsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0020ono870901l0u','lime juice','4 1/2','tsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0021ono81pqlobxq','pointed cabbages','2','whole','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0022ono864ngb4b2','sunflower oil','3','tbsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0023ono8u4yw6f2k','flaked sea salt','1/2','tsp','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0024ono86qgpdvvv','cilantro','1/4','cup','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgodoqn0025ono86vafszkk','lime','1','whole','cmqgodoql001rono8djdu64mo');
INSERT INTO "Ingredient" VALUES('cmqgohftf0027ono87avktzek','mild red chiles','2','whole','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf0028ono89ptcaxh3','Datterini cherry tomatoes ','5','oz','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf0029ono8suqpjop8','sherry vinegar','1 1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002aono8sfpsb547','flaked sea salt','1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002bono8ywi74rna','olive oil','7 1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002cono86yh14jer','garlic','2','cloves','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002dono8ffqxhl23','fresh ginger','1','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002eono80qwwa4c8','flaked sea salt','1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002fono86z6fjg4p','eggplants','2','whole','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002gono8gsnh4ych','sherry vinegar','1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002hono8tkfcbafi','green onions','2','whole','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002iono87toi0gm0','roasted and salted almonds','4 1/2','tsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgohftf002jono8zkisb662','cilantro leaves','1','tbsp','cmqgohftf0026ono8uzt0r7ob');
INSERT INTO "Ingredient" VALUES('cmqgolb04002lono8u8vklwm0','green beans','500','g','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb04002mono8yt6yjnxe','runner beans','500','g','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb05002nono86u3iq7xc','garlic','12','cloves','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb05002oono85cxq6hqb','green Chile','1','whole','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002pono862ve9tww','olive oil','1/2','cup','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002qono8yz5ka4ol','onions','2','whole','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002rono8chcd2kcq','vegetable stock','1','cup','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002sono804vosrlg','table salt','1','pinch','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002tono8zu2w6ckv','black pepper','1','pinch','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002uono8vz5825eu','lemons','2','whole','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002vono81glbppft','tarragon leaves','1/2','cup','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002wono8l7vo079r','dill fronds','1/2','cup','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002xono8br7ztk8e','parsley leaves','1/2','cup','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgolb06002yono8xfwtrnhu','preserved lemon','1 1/4','oz','cmqgolb04002kono8adqt108j');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0030ono8ps6s58sw','beets','10','whole','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0031ono84m0u5hp4','flaked sea salt','1','tbsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0032ono8xzkltz0o','unsalted butter','6','tbsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0033ono89mq34cmz','olive oil','7 1/2','tsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0034ono85h5alqur','fresh makrut lime leaves','5','whole','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0035ono8p0bx03gs','fresh ginger','1/3','oz','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0036ono8jbie79ck','garlic','1','clove','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0037ono8vm2m0hb2','lime juice','1','tbsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0038ono8p0lrcxlg','flaked sea salt','1','tsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk0039ono8e04ccp2b','fresh makrut lime leaves','10','whole','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003aono87zen00gm','fresh ginger','1/2','tsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003bono8pemvcvtg','garlic','1/2','clove','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003cono8bxhyii18','green Chile','1/2','whole','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003dono811gi0ljl','cilantro leaves','1','tbsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003eono8qqkp4xnr','olive oil','3','tbsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003fono8il64jp1s','flaked sea salt','1/4','tsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003gono8l77zim2c','heavy cream','1/3','cup','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003hono89feclo8a','Greek yogurt','1/3','cup','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003iono80ftlk6qn','flaked sea salt','1','pinch','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoqkmk003jono80s0ovduh','lime juice','2','tsp','cmqgoqkmj002zono8bqdm8m0d');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003lono8pt7ayl5c','celery root','1','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003mono8ic1n549a','celery','3','stalks','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003nono8st6tzklz','garlic','2','cloves','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003oono8s5d1pmko','limes','3','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003pono8fgrfx041','rice vinegar','150','ml','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003qono8czgji3py','flaked sea salt','1 1/2','tsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003rono8bo22otgv','sunflower oil','1/2','cup','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003sono8a9gr6tiz','garlic','5','cloves','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003tono8706rfvwd','red chiles','3','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003uono8l2kqptl2','star anise','2','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003vono81dp5ppdg','white sesame seeds','4 1/2','tsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003wono8re4c3kmq','maple syrup','7 1/2','tsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003xono8j7vnbhw7','rice vinegar','1','tbsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003yono821e0k3t5','soy sauce','1/4','cup','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t003zono8htoh6hm7','chives','2','tbsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t0040ono87fexdtb2','celery root','1','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t0041ono8o0af7bpw','olive oil','1/4','cup','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t0042ono8spqvs080','flaked sea salt','1 1/2','tsp','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t0043ono8vngej9vz','green onions','2','whole','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgoxc0t0044ono89d8ad8z9','Thai basil leaves','1/4','cup','cmqgoxc0s003kono8n6xz7hpi');
INSERT INTO "Ingredient" VALUES('cmqgq46mu0046ono8ofloiv47','olive oil','6','tbsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu0047ono8g0y1bj4k','shallot','1','whole','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu0048ono8smx6opwq','garlic','2','cloves','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu0049ono88qitoypk','red Chile flakes','1/4','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004aono8dllcr7x8','balsamic vinegar','1/4','cup','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004bono869ta3t4k','smoked paprika','1/4','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004cono8di5ovsga','ground cumin','1/2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004dono8utwfy7rc','pitted dates','1/2','cup','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004eono8hyq31dku','black garlic','1/4','cup','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004fono8zjsqdon4','water','130','ml','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004gono8lhq56pvz','table salt','1/2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004hono8rml8ydtg','olive oil','6','tbsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004iono8ufi9dq4a','red chiles','2','whole','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004jono88fg5l59z','garlic','2','cloves','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004kono8cmbi9vk1','coriander seeds','2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004lono8550g10c0','table salt','1/2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004mono8ls0ubbha','chives','2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004nono8d3e5avkf','cabbage leaves','16','whole','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004oono8sa55hdr9','celery root','1 ','whole','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004pono8rjkt6o8o','olive oil','1/4','cup','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004qono8k97pua43','flaked sea salt','1 1/2','tsp','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004rono8bokxgi77','goat cheese','4 1/2','oz','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgq46mu004sono8favui0wo','limes','2','whole','cmqgq46mt0045ono80179l557');
INSERT INTO "Ingredient" VALUES('cmqgqn850004uono8fv7ct4f6','unsalted butter','1/2','cup','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn850004vono8cs9frchg','shallot','1','whole','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn850004wono8h5at8zj6','garlic','1','clove','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn850004xono8vipwo5ca','anchovy in olive oil','3','fillets','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn850004yono8ljbpoo1o','mustard powder','1','tbsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn850004zono8cx3lv0gf','medium curry powder','1/2','tsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8500050ono8ekh8wg7d','cayenne pepper','1/4','tsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510051ono83fjbq939','flaked sea salt','1/4','tsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510052ono8c8zbdf3o','baby capers','1','tbsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510053ono8uh3ocqg6','chives','2','tbsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510054ono8lz1yelmp','tarragon leaves','2','tbsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510055ono8wsic4o7i','fresh parsley','1','tbsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510056ono8sf10x67u','thyme leaves','2','fresh','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8510057ono8yxl67rxy','black pepper','1','pinch','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8520058ono8to7vn4j9','celery root','3','whole','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn8520059ono8g6h5409h','olive oil','3/4','cup','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn852005aono8t4j37sdu','flaked sea salt','4 1/2','tsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn852005bono8ni8hvm1i','heavy cream','1/2','cup','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn852005cono8qv7a08ek','lemon juice','2','tsp','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn852005dono8gtqonh8g','flaked sea salt','1','pinch','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqn852005eono8zllo46g3','black pepper','1','pinch','cmqgqn84y004tono88f5j1fr4');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005gono8ygfou6e9','very ripe plantains','2','whole','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005hono8t69m4j1s','olive oil','1/4','cup','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005iono82kg70wts','light brown sugar','2','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005jono8z23rdidq','fresh ginger','1/2','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005kono8iy8wkxoe','ground cinnamon','3/4','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005lono8w2klim24','ground cumin','3/4','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005mono8he4k1ghh','cayenne pepper','1/2','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005nono8p5zcbqck','ground nutmeg','1/2','tsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005oono8s59plrfm','coconut','1/2','whole','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005pono85mj14i5x','limes','2','whole','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005qono8ae9xl4xy','green Chile','1','whole','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005rono8r9njdktk','Granny Smith apple','1','whole','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005sono8gne6ef8j','table salt','1','pinch','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005tono8elfnkiui','unsalted butter','1','tbsp','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005uono8w24esdvs','cilantro leaves','1/2','cup','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgqu3hk005vono8pvqo3ykc','mint leaves','1/2','cup','cmqgqu3hj005fono8fati506o');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5005xono8z16gli3u','fenugreek seeds','4 1/2','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5005yono81y7654g6','garlic','6','cloves','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5005zono8y9lklln3','cayenne pepper','1 1/2','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50060ono8bctkzne5','ground turmeric','1 1/2 ','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50061ono8won34k5g','superfine sugar','2','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50062ono83qyk5sn2','lime juice','2','tbsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50063ono8b3m7r91j','olive oil','1/3','cup','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50064ono8ravbjav9','table salt','3/4','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50065ono8sagu3xk1','rutabagas','3','whole','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50066ono8zfiz4riw','ruby grapefruits','4','whole','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50067ono8nvkskmjn','shallots','2','whole','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50068ono8ezu0q7sv','red chiles','2','whole','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi50069ono8dv7fk2yp','mint leaves','1','cup','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006aono8fq27no1n','cilantro leaves','1/2','cup','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006bono8uet95xng','olive oil','2','tsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006cono8vlis9rpg','lime juice','1','tbsp','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006dono8pmeyf27m','table salt','1','pinch','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006eono890ptbaju','creme fraiche','1/2','cup','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgwxfi5006fono8qzp3ult9','limes','2','whole','cmqgwxfi3005wono8u3lcjbgi');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006hono8rxlmxfd3','red chiles','2','whole','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006iono8jcu76jwa','white wine vinegar','4 1/2','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006jono837xmjtr0','superfine sugar','1/2','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006kono8t5l6dh3i','table salt','1','pinch','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006lono8hiwaq3xu','carrots','800','g','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006mono85vjzb2uv','unsalted butter','2','tbsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006nono83raybivp','fresh ginger','1/4','oz','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006oono8xddmr5wb','nigella seeds','1/2','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006pono8fn0do0wv','fennel seeds','1/2','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006qono8d95by9dp','cumin seeds','1/2','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006rono8d24oi3q0','olive oil','2','tbsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006sono8fhw3e9ns','medium curry powder','1','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006tono8zqku7zpv','ground cinnamon','1/4','tsp','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006uono8awm10dxl','lime juice','1 1/2','tsp ','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006vono855ku52f1','green onion','1','whole','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx1di5006wono8qyuxuhl8','mint leaves','1/4','cup','cmqgx1di4006gono8gjnb0wnj');
INSERT INTO "Ingredient" VALUES('cmqgx5xud006yono8nkvk5ggw','kohlrabi','4','whole','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud006zono80hvfyk5w','anchovy in olive oil','4','fillets','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0070ono8aq38we9c','olive oil','150','ml','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0071ono8nyipup3p','garlic','4','cloves','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0072ono8jubwzhup','table salt','1','pinch','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0073ono85zu1um7x','black pepper','1','pinch','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0074ono8kxcetl70','cherry tomatoes','10 1/2','oz','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0075ono82hbeurws','pearl barley','1 1/2','cups','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0076ono8a5wvt3uh','shallots','3','whole','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0077ono8937wk9xa','caraway seeds','2','tsp','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0078ono8p61r7kp1','lemons','2','whole','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud0079ono8zfv0wfv2','red Scotch bonnet Chile','1','whole','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud007aono860d2temg','tomato paste','3','tbsp','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud007bono8et4db19c','dry white wine','150','ml','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud007cono8yapv38te','water','2','cups','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud007dono8v6qx8jcl','watercress','2 1/4','cups','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx5xud007eono8dao9p05b','heavy cream','1/4','cup','cmqgx5xuc006xono8udiuqr2a');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007gono8kkf94846','shallots','5','whole','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007hono838nx0yqn','garlic','2','cloves','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007iono8iw0bv7a5','olive oil','2','tbsp','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007jono8y6hvhwd3','table salt','1','pinch','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007kono8u851z1fq','Yukon gold potatoes','3','lb','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007lono8822s0o7d','coconut cream','1/3','cup','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007mono89j132yzr','limes','3','whole','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007nono87owcit3o','black pepper','1','pinch','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007oono846lcax1y','vegetable stock','200','ml','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007pono8m2yxxaq7','olive oil','150','ml','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007qono8cqjiehyn','red chiles','2','whole','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007rono8twnt71ta','garlic','3','cloves','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007sono8pfv4x47f','fresh ginger','1/4 ','oz','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007tono8ahssiink','green onions','4','whole','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgx9rxj007uono8wpdank33','flaked sea salt','1','pinch','cmqgx9rxi007fono8xyc3wy45');
INSERT INTO "Ingredient" VALUES('cmqgxduxz007wono89nm34h0o','cilantro','4','cups','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz007xono88m7rytn7','parsley','1 1/2','cups','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz007yono84xbcytiv','baby spinach','14','cups','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz007zono85inzujxu','olive oil','1/2','cup','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0080ono874ansoss','onion','1','whole','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0081ono81m6bvkph','garlic','5','cloves','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0082ono8radwxmup','green chiles','2','whole','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0083ono8vcf4kuy1','ground cumin','1.5','tbsp','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0084ono8yozslc0a','ground coriander','1','tbsp','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0085ono85r46y6x1','ground cinnamon','3/4','tsp ','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0086ono8ensm791j','superfine sugar','1 1/2','tsp','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0087ono808wf8t4b','lemons','2','whole','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0088ono8vtp8u7hn','vegetable stock','1','qt','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz0089ono88rr3yh7b','table salt','1','pinch','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz008aono8672xgct6','waxy potatoes','500','g','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxduxz008bono8cd2fdps0','large butter beans','700','g','cmqgxduxz007vono81o23pmla');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008eono8bwa32l3f','cannellini beans','1 3/4','cups','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008fono8vs59e4jg','baking soda','1','tsp','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008gono8me5y5xeh','onion','1','whole','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008hono8wq1mw866','garlic','10','cloves','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008iono8rfa6tk85','rosemary','2','sprigs','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008jono856in9aau','thyme','3','sprigs','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008kono847gsaax7','green Chile','1','whole','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008lono8o43movt4','olive oil','200','ml','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008mono860xialsg','Dijon mustard','1','tbsp','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008nono87c7koxli','anchovy in olive oil','2','fillets','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008oono8cs5xeyr9','lemon juice','6','tbsp','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008pono8pj9zgw7c','table salt','1','pinch','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008qono8yrjpk5sn','black pepper','1','pinch','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008rono89gwnwlq1','dill','1/2','cup','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgxhreg008sono8q6eoudav','Aleppo Chile flakes','1/2','tsp','cmqgxf4z8008cono8n2bbof18');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008uono8muhjo91g','canned chickpeas','2','cups','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008vono811aqzjxb','fresh ginger','1/3','oz','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008wono8diowg543','olive oil','1','tbsp','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008xono8re3y82b0','tahini','1','tbsp','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008yono8wl15czm8','garlic','1','clove','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb4008zono8f4avisjr','lemons','2','whole','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40090ono82f2yx5zw','ice cold water','2','tbsp','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40091ono8632aucf6','flaked sea salt','3/4','tsp','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40092ono8waesjiya','olive oil','6','tbsp','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40093ono8u1rhcofw','red Chiles','3','whole','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40094ono8n3683ur8','garlic','3','cloves','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40095ono871kw99xx','fresh ginger','1/2','oz','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40096ono8irwrunp4','cinnamon','2','sticks','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40097ono8ug66crkd','cilantro sprigs','1/2','oz','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgy7cb40098ono8n31dkw3d','flaked sea salt','1','pinch','cmqgy7cb3008tono8xc09t6cb');
INSERT INTO "Ingredient" VALUES('cmqgyqy1u009aono8zxn47dr5','shallot','1','whole','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1u009bono8y5j1qx37','lemons','2','whole','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1u009cono8gsn6j1ba','flaked sea salt','1','pinch','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009dono886xax0oa','olive oil','1/4','cup','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009eono8s410ebcs','fresh curry leaves','30','whole','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009fono8bf9r30n3','black mustard seeds','1','tsp','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009gono855m80ljo','watermelon','1','whole','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009hono8sr304bpk','cantaloupe','2/3','whole','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009iono8xkcim3gt','buffalo mozzarella','4','balls','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgyqy1v009jono8zs78et77','kasha','1','tbsp','cmqgyqy1u0099ono8prnygjp9');
INSERT INTO "Ingredient" VALUES('cmqgz9hzr009lono89epgryz7','olive oil','1/4','cup','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzr009mono8ad61p948','cumin seeds','1/2','tsp','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzr009nono8im86f5v7','coriander seeds','1/2','tsp','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzr009oono8t8tvhkz0','garlic','2','cloves','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzr009pono8u61au5kz','table salt','1','pinch','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009qono89q7ab9tp','frozen peas','1 1/4','cups','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009rono88um9mufm','avocados','2','whole','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009sono8pb3q4zr8','cucumber','1/2','whole','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009tono8qe3jwcfc','lemon','1','whole','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009uono8rq0d86t7','cold water','1 2/3','cups','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009vono8y0ni3dis','green Chile','1','whole','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009wono8jm0dr3di','sour cream','1/3','cup','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqgz9hzs009xono847nnxy1m','dill fronds','1','tbsp','cmqgz9hzr009kono8u8gk8cv0');
INSERT INTO "Ingredient" VALUES('cmqhbjaar009zono8vgns7c4b','olive oil','1/2','cup','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a0ono8ojob1c1c','green chiles','2','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a1ono8f7d9bpy0','red chiles','2','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a2ono8p7x5k4g9','fresh curry leaves','20','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a3ono8lfwm7uxq','black mustard seeds','1 1/2','tsp','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a4ono88zwm2vsr','table salt','1','pinch','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a5ono8dirnnviq','canned whole peeled tomatoes','400','g','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a6ono8ygquf5af','garlic','5','cloves','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a7ono8690svlhy','tomatoes','8','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a8ono8vru6s4pc','bay leaves','2','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00a9ono81f8a3482','basil leaves','1/2','cup','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00aaono85327fx4l','superfine sugar','1','tsp','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00abono8nmmt82o9','black pepper','1','pinch','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00acono8hdd0r391','crustless sourdough bread','3 1/2','oz','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqhbjaar00adono8uk5zixi4','lime','1','whole','cmqhbjaaq009yono8hzou65ig');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300auono871btwj1l','olive oil','6','tbsp','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300avono8547l6xqi','garlic','2','cloves','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300awono8sg0ypuh1','red chiles','2','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300axono84w8lcfbj','fresh makrut lime leaves','10','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300ayono8unx6ry1a','black mustard seeds','2','tsp','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300azono8kv4yhs45','shallots','2','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b0ono8gi19atf4','garlic','2','cloves','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b1ono8hfn61atv','fresh makrut lime leaves','4','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b2ono822hn5m3h','ancho Chile','1','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b3ono8hos1lfwe','table salt','1 1/4','tsp','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b4ono8tydlnac1','black beans','1 3/4','cups','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b5ono89ay1t7pf','baking soda','1','tsp','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b6ono8nio8cyt4','water','3','cups','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b7ono83o4lrw8k','lime juice','3','tbsp','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2tw1300b8ono8c5tnofwz','coconut','1/2','whole','cmqi2tpws00aeono8b73kl28h');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500baono8hxkdnh6h','cardamom','14','pods','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bbono8tf8b2wxu','fresh curry leaves','30','whole','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bcono87vbo1dz3','sunflower oil','1/2','cup','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bdono85r2k20zb','egg yolk','1','whole','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500beono8ipnajjrv','garlic','1/2','clove','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bfono8so5n2xyg','limes','4','whole','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bgono8ce9mlc62','flaked sea salt','1','pinch','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bhono86uh1z0gb','russet potatoes','1','kg','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500biono8asywmwbw','sunflower oil','3','tbsp','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi2wuj500bjono8lkpel73h','table salt','3/4','tsp','cmqi2wuj400b9ono8qhcg7m34');
INSERT INTO "Ingredient" VALUES('cmqi353rl00blono8yn35khe0','olive oil','7 1/2','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bmono81w25kxyy','fresh curry leaves','12','whole','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bnono8fqyzh3gc','fresh ginger','2','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00boono8aqa5nrbk','garlic','2','cloves','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bpono8rembnmrm','green Chile','1','whole','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bqono885itba97','green onions','2','whole','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00brono80o787yvy','chickpea flour','2 1/4','cups','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bsono86mnpke6x','cornstarch','1/3','cup','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00btono89g14e4wg','baking powder','1','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00buono8eic8kgqd','sparkling water','1 1/4','cups','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bvono8ezbn3uui','apple cider vinegar','1/4','cup','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bwono8vn3jnqkh','ground cumin','1','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bxono8mqqgtg2s','garam masala','1 1/2','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00byono8rqvwg9kq','table salt','1','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00bzono8hyrxllpy','Greek yogurt','1/2','cup','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c0ono8skp1b8hl','mango','1/2','whole','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c1ono87ohfgr1j','hot mango pickle','2','tbsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c2ono8v97o8pvs','lime zest','1','tsp','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c3ono8rxzhhi2g','table salt','1','pinch','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c4ono84d640kim','sunflower oil','1/4','cup','cmqi353rk00bkono8fn3fptqd');
INSERT INTO "Ingredient" VALUES('cmqi353rl00c5ono8qiojklgj','lime','1','whole','cmqi353rk00bkono8fn3fptqd');

do $$
declare
  item jsonb;
  qid  uuid;
  oid  uuid;
  opt  text;
  ord  bigint;
begin
  for item in
    select * from jsonb_array_elements($json$
[
  {
    "question": "Którzy politycy przedstawili dwie różne wizje zjednoczenia Europy na początku integracji?",
    "options": [
      "Jean Monnet i Charles de Gaulle",
      "Robert Schuman i Konrad Adenauer",
      "Alcide de Gasperi i Winston Churchill",
      "Charles de Gaulle i Konrad Adenauer"
    ],
    "duration": 15
  },
  {
    "question": "Jakie trzy państwa utworzyły Beneluks?",
    "options": [
      "Belgia, Holandia i Luksemburg",
      "Belgia, Francja i Luksemburg",
      "Holandia, Niemcy i Belgia",
      "Luksemburg, Włochy i Holandia"
    ],
    "duration": 15
  },
  {
    "question": "W którym roku powstała Rada Europy i z czyjej inicjatywy?",
    "options": [
      "1949 r.; Schuman, Adenauer, de Gasperi",
      "1951 r.; Schuman, Adenauer, de Gasperi",
      "1949 r.; Monnet, de Gaulle, Churchill",
      "1957 r.; Monnet, Adenauer, de Gasperi"
    ],
    "duration": 15
  },
  {
    "question": "Na mocy jakiego traktatu i kiedy powołano Europejską Wspólnotę Węgla i Stali?",
    "options": [
      "Traktat paryski, 18 kwietnia 1951 r.",
      "Traktat rzymski, 25 marca 1957 r.",
      "Traktat paryski, 25 marca 1957 r.",
      "Traktat rzymski, 18 kwietnia 1951 r."
    ],
    "duration": 15
  },
  {
    "question": "Co powstało na mocy traktatów rzymskich z 1957 r.?",
    "options": [
      "EWG i Euratom",
      "EWWiS i EFTA",
      "OEEC i Rada Europy",
      "EFTA i OECD"
    ],
    "duration": 15
  },
  {
    "question": "Która z poniższych zmian NIE była wynikiem Soboru Watykańskiego II?",
    "options": [
      "Wprowadzenie mszy wyłącznie po łacinie",
      "Msza w językach narodowych odprawiana przodem do ludzi",
      "Zniesienie indeksu ksiąg zakazanych",
      "Zniesienie ekskomunik z 1054 r. między Kościołem rzymskim a prawosławnym"
    ],
    "duration": 20
  },
  {
    "question": "Jaką metodę walki stosował Martin Luther King i co osiągnięto do 1964 r.?",
    "options": [
      "Bierny opór; ustawa o równości obywateli i Pokojowa Nagroda Nobla",
      "Walka zbrojna; ustawa o równości obywateli i Pokojowa Nagroda Nobla",
      "Bierny opór; likwidacja Ku-Klux-Klanu i Nagroda Nobla w dziedzinie literatury",
      "Strajki generalne; ustawa o równości obywateli i Order Orła Białego"
    ],
    "duration": 30
  },
  {
    "question": "Czym charakteryzowały się państwa dobrobytu w powojennej Europie Zachodniej?",
    "options": [
      "Gospodarką rynkową i pomocą dla uboższych",
      "Gospodarką centralnie planowaną i zakazem związków zawodowych",
      "Pełną prywatyzacją przemysłu bez pomocy socjalnej",
      "Likwidacją własności prywatnej"
    ],
    "duration": 20
  },
  {
    "question": "Jakie zjawisko związane jest bezpośrednio z wprowadzeniem pigułki antykoncepcyjnej w 1960 r.?",
    "options": [],
    "open_model": "Rewolucja seksualna",
    "duration": 50
  },
  {
    "question": "Kim była Betty Friedan?",
    "options": [
      "Ideolożką feminizmu, założycielką NOW i autorką „Mistyki kobiecości”",
      "Pierwszą kobietą premierem Wielkiej Brytanii",
      "Liderką ruchu hipisowskiego",
      "Autorką ustawy o równości obywateli USA"
    ],
    "duration": 20
  }
]
    $json$::jsonb)
  loop
    insert into public.questions (question, duration)
    values (item->>'question', coalesce((item->>'duration')::int, 20))
    returning id into qid;

    -- open question: key goes straight to correct_answers, no options
    if item->>'open_model' is not null then
      insert into public.correct_answers (question_id, correct_option_model)
      values (qid, item->>'open_model');
    end if;

    for opt, ord in
      select value, ordinality
      from jsonb_array_elements_text(item->'options') with ordinality
    loop
      insert into public.options (question_id, option)
      values (qid, opt)
      returning id into oid;

      if ord = 1 then  -- first option = correct
        insert into public.correct_answers (question_id, correct_option_id)
        values (qid, oid);
      end if;
    end loop;
  end loop;
end
$$;
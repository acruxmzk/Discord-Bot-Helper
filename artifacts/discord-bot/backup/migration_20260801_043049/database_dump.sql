--
-- PostgreSQL database dump
--

\restrict O8PY6oXr8w6pFvmd14eaBbZD16FRBe0cKnfETawfKWeRuUlzBdt7eQPz02SGqcC

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: movie_panel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movie_panel (
    guild_id character varying(30) NOT NULL,
    channel_id character varying(30) NOT NULL,
    message_id character varying(30) NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: movies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movies (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    watched boolean DEFAULT false NOT NULL,
    note numeric(4,1),
    watched_at date
);


--
-- Name: movies_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.movies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: movies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.movies_id_seq OWNED BY public.movies.id;


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Data for Name: movie_panel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movie_panel (guild_id, channel_id, message_id, updated_at) FROM stdin;
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movies (id, name, watched, note, watched_at) FROM stdin;
6	Thor: O Mundo Sombrio	f	\N	\N
7	Homem de Ferro 3	f	\N	\N
8	Capitão América: Soldado Invernal	f	\N	\N
9	Guardiões da Galáxia	f	\N	\N
10	Guardiões da Galáxia Vol. 2	f	\N	\N
11	Vingadores: Era de Ultron	f	\N	\N
12	Homem-Formiga	f	\N	\N
13	Capitão América: Guerra Civil	f	\N	\N
14	Viúva Negra	f	\N	\N
15	Pantera Negra	f	\N	\N
16	Homem-Aranha: De Volta ao Lar	f	\N	\N
17	Doutor Estranho	f	\N	\N
18	Thor: Ragnarok	f	\N	\N
19	Homem-Formiga e a Vespa	f	\N	\N
20	Vingadores: Guerra Infinita	f	\N	\N
21	Vingadores: Ultimato	f	\N	\N
22	Homem-Aranha: Longe de Casa	f	\N	\N
23	Homem-Aranha: Sem Volta Para Casa	f	\N	\N
24	Eternos	f	\N	\N
25	Doutor Estranho no Multiverso da Loucura	f	\N	\N
26	Pantera Negra: Wakanda Para Sempre	f	\N	\N
27	Thor: Amor e Trovão	f	\N	\N
28	Homem-Formiga e a Vespa: Quantumania	f	\N	\N
29	Guardiões da Galáxia Vol. 3	f	\N	\N
30	Deadpool & Wolverine	f	\N	\N
3	Homem de Ferro 2	t	9.5	2026-06-30
92	Para todos os garotos que já amei	t	7.0	2026-06-30
1	Capitão América: O Primeiro Vingador	t	7.3	2026-06-27
2	Homem de Ferro	t	9.1	2026-07-28
91	Barbie:  A princesa da ilha	t	6.4	2026-07-28
379	Como Mágica	t	7.8	2026-07-06
444	Gato de botas 2	t	10.0	2026-07-09
478	You S1	f	\N	\N
477	Frozen	t	9.2	2026-07-12
5	Os Vingadores	t	8.4	2026-07-12
4	Thor	t	7.9	2026-07-12
511	Para todos os garotos que já amei 2	t	8.5	2026-07-12
544	Super-herói: o filme	t	7.6	2026-07-12
577	Como eu era antes de você	t	9.3	2026-07-12
610	Obsessão	t	9.7	2026-07-14
643	casamento sangrento	t	8.9	2026-07-14
677	12 horas para soibreviver\\	f	\N	\N
678	Uma noite de crime	f	\N	\N
644	Casamento sangrento 2	t	6.5	2026-07-14
679	Uma noite de crime: Anarquia	t	7.0	2026-07-14
841	10 coisas que eu odeio em você	t	9.1	2026-07-17
906	Frozen 2	t	9.3	2026-07-18
1035	Sorria	f	\N	\N
744	O menu	t	7.9	2026-07-22
1100	Orgulho e preconceito	t	8.4	2026-07-25
1133	Cruella	t	9.2	2026-07-31
1134	Masterchef Brasil: Season 3	t	8.7	2026-07-31
\.


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movies_id_seq', 1294, true);


--
-- Name: movie_panel movie_panel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movie_panel
    ADD CONSTRAINT movie_panel_pkey PRIMARY KEY (guild_id);


--
-- Name: movies movies_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_name_key UNIQUE (name);


--
-- Name: movies movies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies
    ADD CONSTRAINT movies_pkey PRIMARY KEY (id);


--
-- PostgreSQL database dump complete
--

\unrestrict O8PY6oXr8w6pFvmd14eaBbZD16FRBe0cKnfETawfKWeRuUlzBdt7eQPz02SGqcC


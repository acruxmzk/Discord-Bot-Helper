--
-- PostgreSQL database dump
--

\restrict XCmwMIM5kaMWfPhbPvSGc3O3acKtqNJO6oZKtOVnW1EZvLczoSkA8ChFKD4udrQ

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

--
-- Name: unaccent; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA public;


--
-- Name: EXTENSION unaccent; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION unaccent IS 'text search dictionary that removes accents';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: banned_players; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.banned_players (
    id integer NOT NULL,
    uid character varying(25) NOT NULL,
    reason text NOT NULL,
    banned_by character varying(60) DEFAULT 'STAFF'::character varying NOT NULL,
    banned_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: banned_players_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.banned_players_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: banned_players_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.banned_players_id_seq OWNED BY public.banned_players.id;


--
-- Name: inscricoes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscricoes (
    id integer NOT NULL,
    registro_id character varying(25) NOT NULL,
    status character varying(20) DEFAULT 'PENDENTE'::character varying NOT NULL,
    guild_id character varying(30) NOT NULL,
    solicitante_id character varying(30) NOT NULL,
    cla character varying(80) NOT NULL,
    tag character varying(25) NOT NULL,
    line character varying(60),
    manager character varying(60),
    tiktok character varying(100),
    jogadores jsonb DEFAULT '[]'::jsonb NOT NULL,
    ticket_channel_id character varying(30),
    fichas_msg_id character varying(30),
    fichas_ch_id character varying(30),
    aprovado_por character varying(30),
    aprovado_em timestamp with time zone,
    rejeitado_por character varying(30),
    rejeitado_em timestamp with time zone,
    motivo_rejeicao text,
    observacoes text,
    criado_em timestamp with time zone DEFAULT now() NOT NULL,
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: inscricoes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscricoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscricoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscricoes_id_seq OWNED BY public.inscricoes.id;


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
    watched_at timestamp without time zone,
    tmdb_id integer,
    tmdb_media_type character varying(10),
    genres text[] DEFAULT '{}'::text[] NOT NULL,
    category character varying(80) DEFAULT 'Outros'::character varying NOT NULL,
    tmdb_synced_at timestamp without time zone
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
-- Name: regulamento_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.regulamento_config (
    chave character varying(50) NOT NULL,
    valor text NOT NULL,
    atualizado_por character varying(60),
    atualizado_em timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tally_submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tally_submissions (
    id integer NOT NULL,
    submission_id character varying(100) NOT NULL,
    form_name character varying(200),
    squad_name character varying(150),
    squad_name_norm character varying(150),
    squad_tag character varying(50),
    manager_name character varying(150),
    uids text[] DEFAULT '{}'::text[] NOT NULL,
    raw_extras jsonb DEFAULT '[]'::jsonb NOT NULL,
    received_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tally_submissions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tally_submissions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tally_submissions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tally_submissions_id_seq OWNED BY public.tally_submissions.id;


--
-- Name: banned_players id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_players ALTER COLUMN id SET DEFAULT nextval('public.banned_players_id_seq'::regclass);


--
-- Name: inscricoes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes ALTER COLUMN id SET DEFAULT nextval('public.inscricoes_id_seq'::regclass);


--
-- Name: movies id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movies ALTER COLUMN id SET DEFAULT nextval('public.movies_id_seq'::regclass);


--
-- Name: tally_submissions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tally_submissions ALTER COLUMN id SET DEFAULT nextval('public.tally_submissions_id_seq'::regclass);


--
-- Data for Name: banned_players; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.banned_players (id, uid, reason, banned_by, banned_at) FROM stdin;
1	6743908386431565825	2001 ex N	davidlim_9	2026-06-18 02:02:22.496326+00
2	6956665254303170561	2005 ex N	davidlim_9	2026-06-18 02:03:18.7857+00
3	7197972326263750657	estranho ex N	davidlim_9	2026-06-18 02:04:01.686049+00
4	6965690260374618013	2002 ex N	davidlim_9	2026-06-18 02:05:47.973936+00
5	7167078803737870337	2004  ex N	davidlim_9	2026-06-18 02:07:45.826184+00
6	6956665254308170561	2005 ex N	davidlim_9	2026-06-18 02:08:55.592722+00
\.


--
-- Data for Name: inscricoes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscricoes (id, registro_id, status, guild_id, solicitante_id, cla, tag, line, manager, tiktok, jogadores, ticket_channel_id, fichas_msg_id, fichas_ch_id, aprovado_por, aprovado_em, rejeitado_por, rejeitado_em, motivo_rejeicao, observacoes, criado_em, atualizado_em) FROM stdin;
\.


--
-- Data for Name: movie_panel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movie_panel (guild_id, channel_id, message_id, updated_at) FROM stdin;
\.


--
-- Data for Name: movies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.movies (id, name, watched, note, watched_at, tmdb_id, tmdb_media_type, genres, category, tmdb_synced_at) FROM stdin;
1	Capitão América: O Primeiro Vingador	f	\N	\N	\N	\N	{}	Outros	\N
2	Homem de Ferro	f	\N	\N	\N	\N	{}	Outros	\N
3	Homem de Ferro 2	f	\N	\N	\N	\N	{}	Outros	\N
4	Thor	f	\N	\N	\N	\N	{}	Outros	\N
5	Os Vingadores	f	\N	\N	\N	\N	{}	Outros	\N
6	Thor: O Mundo Sombrio	f	\N	\N	\N	\N	{}	Outros	\N
7	Homem de Ferro 3	f	\N	\N	\N	\N	{}	Outros	\N
8	Capitão América: Soldado Invernal	f	\N	\N	\N	\N	{}	Outros	\N
9	Guardiões da Galáxia	f	\N	\N	\N	\N	{}	Outros	\N
10	Guardiões da Galáxia Vol. 2	f	\N	\N	\N	\N	{}	Outros	\N
11	Vingadores: Era de Ultron	f	\N	\N	\N	\N	{}	Outros	\N
12	Homem-Formiga	f	\N	\N	\N	\N	{}	Outros	\N
13	Capitão América: Guerra Civil	f	\N	\N	\N	\N	{}	Outros	\N
14	Viúva Negra	f	\N	\N	\N	\N	{}	Outros	\N
15	Pantera Negra	f	\N	\N	\N	\N	{}	Outros	\N
16	Homem-Aranha: De Volta ao Lar	f	\N	\N	\N	\N	{}	Outros	\N
17	Doutor Estranho	f	\N	\N	\N	\N	{}	Outros	\N
18	Thor: Ragnarok	f	\N	\N	\N	\N	{}	Outros	\N
19	Homem-Formiga e a Vespa	f	\N	\N	\N	\N	{}	Outros	\N
20	Vingadores: Guerra Infinita	f	\N	\N	\N	\N	{}	Outros	\N
21	Vingadores: Ultimato	f	\N	\N	\N	\N	{}	Outros	\N
22	Homem-Aranha: Longe de Casa	f	\N	\N	\N	\N	{}	Outros	\N
23	Homem-Aranha: Sem Volta Para Casa	f	\N	\N	\N	\N	{}	Outros	\N
24	Eternos	f	\N	\N	\N	\N	{}	Outros	\N
25	Doutor Estranho no Multiverso da Loucura	f	\N	\N	\N	\N	{}	Outros	\N
26	Pantera Negra: Wakanda Para Sempre	f	\N	\N	\N	\N	{}	Outros	\N
27	Thor: Amor e Trovão	f	\N	\N	\N	\N	{}	Outros	\N
28	Homem-Formiga e a Vespa: Quantumania	f	\N	\N	\N	\N	{}	Outros	\N
29	Guardiões da Galáxia Vol. 3	f	\N	\N	\N	\N	{}	Outros	\N
30	Deadpool & Wolverine	f	\N	\N	\N	\N	{}	Outros	\N
31	Barbie:  A princesa da ilha	f	\N	\N	\N	\N	{}	Outros	\N
32	Para todos os garotos que já amei	f	\N	\N	\N	\N	{}	Outros	\N
33	Como Mágica	f	\N	\N	\N	\N	{}	Outros	\N
34	Gato de botas 2	f	\N	\N	\N	\N	{}	Outros	\N
35	Frozen	f	\N	\N	\N	\N	{}	Outros	\N
36	Para todos os garotos que já amei 2	f	\N	\N	\N	\N	{}	Outros	\N
37	Super-herói: o filme	f	\N	\N	\N	\N	{}	Outros	\N
38	Como eu era antes de você	f	\N	\N	\N	\N	{}	Outros	\N
39	Obsessão	f	\N	\N	\N	\N	{}	Outros	\N
40	casamento sangrento	f	\N	\N	\N	\N	{}	Outros	\N
41	Casamento sangrento 2	f	\N	\N	\N	\N	{}	Outros	\N
42	12 horas para sobreviver	f	\N	\N	\N	\N	{}	Outros	\N
43	Uma noite de crime	f	\N	\N	\N	\N	{}	Outros	\N
44	Uma noite de crime: Anarquia	f	\N	\N	\N	\N	{}	Outros	\N
45	O menu	f	\N	\N	\N	\N	{}	Outros	\N
46	10 coisas que eu odeio em você	f	\N	\N	\N	\N	{}	Outros	\N
47	Frozen 2	f	\N	\N	\N	\N	{}	Outros	\N
48	Sorria	f	\N	\N	\N	\N	{}	Outros	\N
49	Orgulho e preconceito	f	\N	\N	\N	\N	{}	Outros	\N
50	Cruella	f	\N	\N	\N	\N	{}	Outros	\N
51	Masterchef Brasil: Season 3	f	\N	\N	\N	\N	{}	Outros	\N
52	Zootopia	f	\N	\N	\N	\N	{}	Outros	\N
53	Rango	f	\N	\N	\N	\N	{}	Outros	\N
54	Dexter: Season 1	f	\N	\N	\N	\N	{}	Outros	\N
55	Masterchef Profissionais: Season 2	f	\N	\N	\N	\N	{}	Outros	\N
56	Misterio no Mediterrâneo	f	\N	\N	\N	\N	{}	Outros	\N
57	Misterio em Paris	f	\N	\N	\N	\N	{}	Outros	\N
58	O homem de toronto	f	\N	\N	\N	\N	{}	Outros	\N
\.


--
-- Data for Name: regulamento_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.regulamento_config (chave, valor, atualizado_por, atualizado_em) FROM stdin;
mensagens_ids	{"channelId":"1514160341075103774","messageIds":["1516413331554959480","1516413332813381712","1516413333748580452","1516413334734245928","1516413335799857184","1516413337154617344","1516413358893699102","1516413359858126909","1516413361003433995","1516413361900879882","1516413362592809024","1516413381672702073","1516413382603837532","1516413384076034071","1516413386035036190"]}	\N	2026-06-16 12:05:25.013272+00
\.


--
-- Data for Name: tally_submissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tally_submissions (id, submission_id, form_name, squad_name, squad_name_norm, squad_tag, manager_name, uids, raw_extras, received_at) FROM stdin;
\.


--
-- Name: banned_players_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.banned_players_id_seq', 6, true);


--
-- Name: inscricoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscricoes_id_seq', 1, false);


--
-- Name: movies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.movies_id_seq', 232, true);


--
-- Name: tally_submissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tally_submissions_id_seq', 1, false);


--
-- Name: banned_players banned_players_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_players
    ADD CONSTRAINT banned_players_pkey PRIMARY KEY (id);


--
-- Name: banned_players banned_players_uid_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.banned_players
    ADD CONSTRAINT banned_players_uid_key UNIQUE (uid);


--
-- Name: inscricoes inscricoes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_pkey PRIMARY KEY (id);


--
-- Name: inscricoes inscricoes_registro_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscricoes
    ADD CONSTRAINT inscricoes_registro_id_key UNIQUE (registro_id);


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
-- Name: regulamento_config regulamento_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.regulamento_config
    ADD CONSTRAINT regulamento_config_pkey PRIMARY KEY (chave);


--
-- Name: tally_submissions tally_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tally_submissions
    ADD CONSTRAINT tally_submissions_pkey PRIMARY KEY (id);


--
-- Name: tally_submissions tally_submissions_submission_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tally_submissions
    ADD CONSTRAINT tally_submissions_submission_id_key UNIQUE (submission_id);


--
-- Name: idx_tally_squad; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tally_squad ON public.tally_submissions USING btree (squad_name_norm);


--
-- Name: idx_tally_uids; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tally_uids ON public.tally_submissions USING gin (uids);


--
-- PostgreSQL database dump complete
--

\unrestrict XCmwMIM5kaMWfPhbPvSGc3O3acKtqNJO6oZKtOVnW1EZvLczoSkA8ChFKD4udrQ


# Contexto de entrega para HU-GC-06

## 1. Objetivo

Este documento entrega al siguiente agente el contexto necesario para implementar
HU-GC-06: **Gestionar partidos**.

No contiene cambios de implementación pendientes ni solicita que se creen archivos
durante la lectura. El alcance de esta entrega todavía no debe modificarse.

---

## 2. Estado actual del proyecto

El microservicio `ms_sport_system` está implementado con NestJS, TypeORM y MySQL.

Ejecuta en:

- NestJS: `http://localhost:3000`
- Frontend: `http://127.0.0.1:5173`
- Microservicio de seguridad: `http://localhost:8181`

Base de datos configurada: `sports_system_db`.

Las siguientes historias ya están implementadas:

| HU | Estado | Funcionalidad |
|---|---|---|
| HU-GC-01 | Implementada | Gestión CRUD de torneos |
| HU-GC-08 Inscripciones | Implementada | Inscribir y retirar equipos |
| HU-GC-03 | Implementada | Gestionar fases de torneos |
| HU-GC-04 | Implementada | Gestionar grupos y asignar equipos |
| HU-GC-05 | Implementada | Llaves eliminatorias y ganadores |

---

## 3. Responsabilidad de HU-GC-06

HU-GC-06 corresponde a **Gestionar partidos**:

- programar encuentros;
- relacionar partidos con torneo, fase y equipos;
- validar fechas y participantes;
- modificar partidos programados;
- cancelar o eliminar partidos conforme a sus referencias;
- consultar partidos por estado, torneo y fase;
- notificar por correo a aficionados sobre partidos próximos.

HU-GC-06 no debe implementar:

- apuestas;
- métodos de pago;
- resultados/anotaciones en vivo;
- seguimiento espacial;
- creación de equipos, torneos, fases o grupos;
- generación de llaves eliminatorias.

Las funciones anteriores pertenecen a otros integradores o historias.

---

## 4. Código existente reutilizable

### 4.1. Módulo de partidos

El módulo actual está en `src/match/`:

- `match.controller.ts`
- `match.service.ts`
- `match.module.ts`
- `entities/match.entity.ts`
- `dto/match.dtos.ts`
- `dto/match-response.dto.ts`
- `mappers/match.mapper.ts`
- `match.constants.ts`
- `match.rules.ts`

Ya ofrece:

- creación;
- consulta;
- consulta de partidos disponibles;
- actualización;
- eliminación;
- registro de resultado oficial;
- validación de equipos diferentes;
- validación de ventana de apuestas;
- estados de partido.

Sin embargo, su responsabilidad actual mezcla programación deportiva y apuestas:

- contiene cuotas;
- contiene `bettingEnabled`;
- contiene `bettingClosesAt`;
- permite registrar resultados oficiales.

HU-GC-06 puede reutilizar el CRUD de partidos, pero debe mantener separadas
las responsabilidades. Las apuestas deben seguir perteneciendo a HU-GC-11 y
los resultados/anotaciones pueden pertenecer a HU-GC-07.

### 4.2. Entidades existentes

Las siguientes entidades deben reutilizarse:

- [Tournament](src/tournament/entities/tournament.entity.ts)
- [TournamentRegistration](src/tournament_registration/entities/tournament-registration.entity.ts)
- [TournamentPhase](src/tournament_phase/entities/tournament-phase.entity.ts)
- [TournamentGroup](src/tournament_group/entities/tournament-group.entity.ts)
- [Team](src/team/entities/team.entity.ts)
- [Match](src/match/entities/match.entity.ts)

No se deben crear entidades duplicadas para torneo, equipo, fase o partido.

### 4.3. Notificaciones

Existe el módulo [NotificationsModule](src/notifications/notifications.module.ts)
y el adaptador HTTP [HttpNotificationsClient](src/notifications/http-notifications.client.ts).

Actualmente la interfaz de notificaciones está orientada únicamente a apuestas:

- `BET_REGISTERED`
- `BET_SETTLED`

Para HU-GC-06 conviene ampliar el contrato con tipos neutrales de partido,
por ejemplo:

- `MATCH_CREATED`
- `MATCH_UPDATED`
- `MATCH_CANCELLED`
- `MATCH_REMINDER`

La ampliación debe hacerse sin eliminar el contrato existente de apuestas.

### 4.4. Seguridad

El acceso HTTP pasa por `SecurityGuard`.

El seeder de `ms_security` ya contiene permisos de `/matches`.

Antes de implementar nuevas rutas relacionadas con torneos y partidos,
agregar permisos específicos al seeder y asignarlos al rol `ADMIN`.

---

## 5. Integración con HU-GC-05

Los cruces ya implementados están en `TournamentBracket`:

- `tournament_brackets`
- ronda `QUARTERFINAL`, `SEMIFINAL` o `FINAL`
- `team_a_id`
- `team_b_id`
- `winner_team_id`
- estado del cruce

Una mejora recomendada es:

- agregar `bracket_id` opcional a `Match`;
- relacionar el partido con `tournament_id`, `phase_id` y `bracket_id`;
- crear partidos para equipos que ya formen parte del cruce;
- impedir partidos con equipos distintos a los participantes del cruce;
- actualizar el ganador de la llave a partir de una acción posterior de resultado,
  pero sin implementar la HU-GC-07 en esta etapa.

En esta historia no se necesita modificar `TournamentBracket` para crear
partidos automáticamente. La relación puede quedar preparada para el siguiente
desarrollo.

---

## 6. Cambios recomendados para HU-GC-06

### 6.1. Recomendación principal

Mantener `MatchService` como servicio de programación de partidos y extenderlo
en lugar de crear otro servicio paralelo.

Recomendación de responsabilidad:

- `MatchService`: validar y persistir partido;
- `MatchMapper`: convertir DTO/entidad/respuesta;
- `MatchRepository`: persistencia;
- `TournamentFixtureService`: generar o proponer partidos de una fase;
- `MatchNotificationService`: coordinar avisos a aficionados;
- `TournamentBracketService`: no se modifica en esta HU.

No conviene colocar generación de fixture, envío de correos y persistencia de
partidos en un único método de `MatchService`.

### 6.2. Campos sugeridos

El modelo actual de `Match` debería vincularse opcionalmente con:

- `tournamentId`
- `phaseId`
- `bracketId`
- `groupId`
- `venue`
- `roundLabel`

No se recomienda agregar todos los campos con migración directa si se desea
mantener compatibilidad con partidos ya existentes. Se puede iniciar con:

- `tournament_id` nullable;
- `phase_id` nullable;
- `bracket_id` nullable;
- `venue` nullable.

El partido seguirá admitiendo equipos existentes mediante
`homeTeamId` y `awayTeamId`.

### 6.3. Validaciones mínimas

Antes de crear o actualizar un partido se deben verificar:

- torneo existente;
- fase existente y perteneciente al torneo;
- equipo local y visitante existentes;
- equipos distintos;
- equipos inscritos en el torneo;
- fecha dentro de la fase y el torneo;
- hora de inicio posterior a la actual al crear;
- hora válida al actualizar;
- partido no finalizado o cancelado al modificar/eliminar;
- brida eliminatoria: equipos del cruce correspondiente;
- no crear partidos duplicados para la misma fase, ronda y equipos;
- partidos con equipos que cambiaron de inscripción no deben permanecer.

### 6.4. Estados sugeridos

Los estados existentes pueden mantenerse:

- `SCHEDULED`
- `BETTING_OPEN`
- `BETTING_CLOSED`
- `IN_PROGRESS`
- `FINISHED`
- `CANCELLED`

No mezclar los estados de torneo o fase con el estado del partido.

Cada entidad debe conservar su propia máquina de estados.

### 6.5. API sugerida

Mantener `/matches` como base.

Extender o agregar:

- `GET /tournaments/:tournamentId/matches`
- `POST /tournaments/:tournamentId/matches`
- `GET /tournaments/:tournamentId/phases/:phaseId/matches`
- `POST /tournaments/:tournamentId/phases/:phaseId/matches`
- `PATCH /matches/:id`
- `DELETE /matches/:id`
- `GET /matches/:id`

La forma exacta debe acordarse con el Frontend. Evitar rutas duplicadas que
solo cambian el prefijo sin aportar responsabilidad.

### 6.6. Notificaciones

La notificación de partidos previos puede reutilizar el adaptador HTTP existente.

No debe enviar correos desde el controlador ni desde `MatchMapper`.

Responsabilidad sugerida:

1. `MatchService` crea o actualiza el partido.
2. `MatchNotificationService` identifica aficionados a notificar.
3. El adaptador HTTP realiza el envío best effort.
4. Un fallo de correo no revierte el partido creado.

Primero acordar:

- qué aficionados reciben avisos;
- si se notificará por equipo, torneo, fase o todos los aficionados;
- frecuencia de avisos previos;
- cuándo se considera partido próximo.

---

## 7. Diseño recomendado de implementación

Orden sugerido:

1. Crear migración para campos de torneo/fase/grupo/llave/ubicación.
2. Extender `MatchEntity` y el mapper.
3. Agregar relaciones en DTO de creación y actualización.
4. Crear reglas puras de programación en `match.rules.ts`.
5. Inyectar repositorios de torneo, fase, inscripción y equipos.
6. Validar que los equipos estén inscritos.
7. Agregar validaciones de fase, fecha y brida eliminatoria.
8. Integrar la consulta por torneo y fase.
9. Crear el adaptador neutral de notificaciones.
10. Agregar una ruta o servicio de partidos próximos.
11. Crear página Frontend de partidos.
12. Ejecutar pruebas unitarias, E2E y de permisos.

---

## 8. Pruebas requeridas

Probar al menos:

- crear partido con equipos válidos;
- rechazar mismo equipo local y visitante;
- rechazar equipo no inscrito;
- rechazar fase fuera del torneo;
- rechazar fecha fuera del rango de torneo/fase;
- rechazar fecha anterior;
- actualizar partido sin convertirlo en estado terminado;
- impedir modificar partido terminado/cancelado;
- impedir eliminar partido referenciado por apuestas;
- listar partidos por torneo y fase;
- consultar partido inexistente;
- generar notificación sin bloquear la operación;
- función de cuartos, semifinal y final con HU-GC-05;
- permisos HTTP con usuario autenticado.

---

## 9. Puntos de integración

### Con HU-GC-01

Consume:

- equipos;
- deportes;
- relaciones equipo-deporte.

### Con HU-GC-08

Consume:

- equipos inscritos en el torneo.

### Con HU-GC-03

Consume:

- fases del torneo.

### Con HU-GC-04

Puede consultar:

- equipos asignados a grupos.

### Con HU-GC-05

Consume opcionalmente:

- `bracketId`;
- equipo A;
- equipo B;
- ganador.

No debe modificar las llaves directamente desde `MatchService`.

### Con HU-GC-07

Debe compartir:

- estado `FINISHED`;
- resultado oficial;
- identificador de partido.

### Con HU-GC-11

Debe preservar:

- odds;
- apuestas registradas;
- cierre de apuestas;
- eliminación bloqueada por apuestas.

---

## 10. Riesgos conocidos

El módulo actual de partidos tiene estos puntos que el siguiente agente debe
conservar o decidir explícitamente:

- no valida actualmente que el equipo exista antes de guardar;
- no valida actualmente inscripción en el torneo;
- no relaciona partidos con torneo o fase;
- no tiene relación con llaves;
- no informa a aficionados de partidos próximos;
- permite eliminar pero bloquea si existen apuestas referenciadas;
- incluye cuotas aunque HU-GC-06 no se ocupa de apuestas;
- puede admitir resultados oficiales aunque esa responsabilidad puede pertenecer
  a HU-GC-07.

No se recomienda retirar estas funciones de golpe sin acordar las dependencias
con HU-GC-07 y HU-GC-11.

---

## 11. Criterio de acabado recomendado

HU-GC-06 puede considerarse completa cuando:

- puede crear partidos asociados a torneo y fase;
- valida equipos inscritos;
- impide equipos iguales;
- permite consultar y modificar partidos;
- impide modificar partidos finalizados/cancelados;
- conserva la relación con llaves cuando corresponde;
- mantiene cuotas y apuestas sin mezclar lógica;
- envía avisos best effort a aficionados;
- tiene pruebas unitarias y E2E;
- tiene permisos registrados en `ms_security`;
- tiene una página o ruta Frontend clara.

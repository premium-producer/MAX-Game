"""Technical MAX port contracts, not the canonical game's internal rules."""
from typing import Literal
from pydantic import Field, model_validator
from package_models import Strict, Id, read_config

MissionId = Literal['business', 'digital-id', 'communication', 'blogger']

class Settings(Strict):
    id: Id
    version: Id
    quizIdleMs: int = Field(ge=200, le=600000)
    # Frozen at admission. Omitted historical specs keep their original clock.
    quizAnswerRevealGroupMs: int = Field(default=0, ge=0, le=600000)
    touchWaitMs: int = Field(ge=200, le=3600000)
    # Frozen with the admitted quiz; missing historical settings retain the launch route.
    stellaLaunchPolicy: Literal['arch-ribbon', 'direct'] = 'arch-ribbon'

class Option(Strict):
    id: Id
    label: str = Field(min_length=1, max_length=200)

class Question(Strict):
    id: Literal['audience', 'goal']
    prompt: str = Field(min_length=1, max_length=300)
    options: list[Option] = Field(min_length=2, max_length=3)

class Mission(Strict):
    missionId: MissionId
    label: str = Field(min_length=1, max_length=200)

class Definition(Strict):
    protocol: Literal['stella-max-v1']
    id: Id
    version: Id
    questions: list[Question] = Field(min_length=2, max_length=2)
    missions: list[Mission] = Field(min_length=4, max_length=4)
    routing: dict[str, dict[str, MissionId]]

    @model_validator(mode='after')
    def complete(self):
        if [q.id for q in self.questions] != ['audience', 'goal']: raise ValueError('Question order differs')
        audiences = [o.id for o in self.questions[0].options]
        goals = [o.id for o in self.questions[1].options]
        if set(audiences) != {'business', 'personal'} or set(goals) != {'access', 'connection', 'visibility'}:
            raise ValueError('Quiz IDs differ')
        if len(set(audiences)) != len(audiences) or len(set(goals)) != len(goals): raise ValueError('Duplicate options')
        if {m.missionId for m in self.missions} != {'business', 'digital-id', 'communication', 'blogger'}: raise ValueError('Mission IDs differ')
        if set(self.routing) != set(audiences) or any(set(row) != set(goals) for row in self.routing.values()):
            raise ValueError('Routing must cover all answers')
        return self

class Admission(Strict):
    requestId: Id
    sessionId: Id
    visitId: Id
    stationId: Literal['stella-main']

class QuizCommand(Strict):
    commandId: Id
    expectedRevision: int = Field(ge=0)
    kind: Literal['answer', 'confirm', 'back', 'pause', 'resume', 'cancel']
    questionId: Literal['audience', 'goal'] | None = None
    answerId: str | None = None

    @model_validator(mode='after')
    def shape(self):
        if self.kind == 'answer':
            if self.questionId is None or self.answerId is None:
                raise ValueError('Answer requires question and answer IDs')
        elif self.questionId is not None or self.answerId is not None:
            raise ValueError('Unexpected answer fields')
        return self

class WallCommand(Strict):
    commandId: Id
    expectedRevision: int = Field(ge=0)
    assignmentId: Id | None
    kind: Literal['wall_select', 'wall_start', 'delivery', 'presented', 'contact', 'finish', 'cancel', 'pause', 'resume', 'launch_marker']
    missionId: MissionId | None = None
    planId: Id | None = None
    marker: Literal['tags_complete', 'ribbon_complete', 'wall_arrived'] | None = None

    @model_validator(mode='after')
    def shape(self):
        if self.kind == 'launch_marker':
            if self.planId is None or self.marker is None: raise ValueError('Launch marker requires planId and marker')
        elif self.planId is not None or self.marker is not None: raise ValueError('Unexpected launch fields')
        if (self.kind == 'wall_start') != (self.missionId is not None):
            raise ValueError('Only wall_start requires missionId')
        if (self.kind == 'wall_select') != (self.assignmentId is None):
            raise ValueError('Current assignment binding is required')
        return self

QUESTIONS = [
    {'id': 'audience', 'prompt': 'Какие возможности ты хочешь освоить?', 'options': [
        {'id': 'business', 'label': 'Для бизнеса'}, {'id': 'personal', 'label': 'Для личного пользования'}]},
    {'id': 'goal', 'prompt': 'Какой цели хочешь достичь?', 'options': [
        {'id': 'access', 'label': 'Упростить идентификацию'}, {'id': 'connection', 'label': 'Быть на связи 24/7'},
        {'id': 'visibility', 'label': 'Повысить узнаваемость'}]},
]
MISSIONS = [
    {'missionId': 'digital-id', 'label': 'Все возможности с Цифровым ID'},
    {'missionId': 'communication', 'label': 'Общение на максимум'},
    {'missionId': 'blogger', 'label': 'Стать блогером'},
    {'missionId': 'business', 'label': 'Продвижение бизнеса'},
]

def settings():
    return Settings.model_validate(read_config('max-settings.json')).model_dump()

def definition():
    return Definition.model_validate(read_config('max-quiz.json')).model_dump()

def mission(answers):
    # D getMaxMission; explicit adapter of prototype business-promotion to canonical business.
    return 'business' if answers['audience'] == 'business' else {
        'access': 'digital-id', 'connection': 'communication', 'visibility': 'blogger'}[answers['goal']]

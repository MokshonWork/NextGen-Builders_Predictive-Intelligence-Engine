from typing import TypedDict

from langgraph.graph import StateGraph

from agents.validation_agent import ValidationAgent
from agents.cleaning_agent import CleaningAgent
from agents.forecast_agent import ForecastAgent
from agents.insight_agent import InsightAgent


class GraphState(TypedDict):

    data: dict


def validation_node(state):

    state["data"] = ValidationAgent.run(

        state["data"]
    )

    return state


def cleaning_node(state):

    state["data"] = CleaningAgent.run(

        state["data"]
    )

    return state


def forecast_node(state):

    state["data"] = ForecastAgent.run(

        state["data"]
    )

    return state


def insight_node(state):

    state["data"] = InsightAgent.run(

        state["data"]
    )

    return state


builder = StateGraph(

    GraphState
)

builder.add_node(

    "validation",

    validation_node
)

builder.add_node(

    "cleaning",

    cleaning_node
)

builder.add_node(

    "forecast",

    forecast_node
)

builder.add_node(

    "insight",

    insight_node
)

builder.set_entry_point(

    "validation"
)

builder.add_edge(

    "validation",

    "cleaning"
)

builder.add_edge(

    "cleaning",

    "forecast"
)

builder.add_edge(

    "forecast",

    "insight"
)

graph = builder.compile()
import plotly.graph_objects as go

class ForecastChart:

    @staticmethod
    def create_chart(history_df, forecast_df):
        fig = go.Figure()
        fig.add_trace(
            go.Scatter(
                x=history_df["Date"],
                y=history_df["Value"],
                mode="lines+markers",
                name="Historical Data"
            )
        )

        fig.add_trace(
            go.Scatter(
                x=forecast_df["Date"],
                y=forecast_df["Forecast"],
                mode="lines+markers",
                name="Forecast"
            )
        )

        fig.update_layout(
            title="FutureSight AI Forecast",
            xaxis_title="Date",
            yaxis_title="Value",
            hovermode="x unified"
        )

        return fig
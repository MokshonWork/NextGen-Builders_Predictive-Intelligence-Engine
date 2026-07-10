import streamlit as st
import pandas as pd
from core.validator import CSVValidator
from core.cleaner import DataCleaner


st.title(" Upload your Dataset")#title
#file uploading
uploaded_file = st.file_uploader(
    "Upload CSV",
    type=["csv"]
)

if uploaded_file:
    try:
        # reading csv
        try:
            df = pd.read_csv(uploaded_file)

        except UnicodeDecodeError:
            uploaded_file.seek(0)
            df = pd.read_csv(
                uploaded_file,
                encoding="latin1"
            )

         # privew
        st.success("CSV Loaded Successfully")
        st.subheader(" Dataset Preview")

        st.dataframe(
            df.head(10),
            use_container_width=True
        )

        #validating it
        result = CSVValidator.validate(df)

        st.session_state["raw_df"] = df
        st.session_state["validation_result"] = result

        st.divider()

        st.subheader(" Validation Report")

        #errors(if there are errors)
        if result.errors:
            for error in result.errors:
                st.error(error)

        # WARNINGSS
        if result.warnings:

            for warning in result.warnings:
                st.warning(warning)

        if result.is_valid:#cleaning
            st.success(
                f"""
               Dataset Valid 
                Rows: {result.n_rows}
               Frequency: {result.detected_frequency}
              """
            )

            clean_df, clean_log = DataCleaner.clean(df)
            st.session_state["clean_df"] = clean_df
            st.session_state["clean_log"] = clean_log

            st.subheader(" Cleaning Reports")

            st.info(
                f"""
                Duplicates Removed: {clean_log.duplicates_removed}

                Missing Values Filled: {clean_log.nulls_filled}

                Outliers Capped: {clean_log.outliers_capped}

                Final Rows: {clean_log.final_row_count}
                """
            )

            if st.button("Proceed to Forecast -->"):

                st.switch_page(
                    "pages/3_Forecast.py"
                )

    except Exception as e:
        st.error(
            f"Something went wrong:\n\n{e}"
        )
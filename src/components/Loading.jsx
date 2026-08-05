import "../styles/loading.css";

function Loading({

    type = "page",

    text = "Loading..."

}) {

    if (type === "button") {

        return (

            <span className="button-loader">

                <span className="mini-spinner"></span>

                {text}

            </span>

        );

    }

    if (type === "table") {

        return (

            <div className="table-loader">

                <div className="loading-spinner"></div>

                <p>{text}</p>

            </div>

        );

    }

    return (

        <div className="loading-container">

            <div className="loading-card">

                <div className="loading-spinner"></div>

                <h2>{text}</h2>

                <p>Please wait while we prepare your data.</p>

            </div>

        </div>

    );

}

export default Loading;
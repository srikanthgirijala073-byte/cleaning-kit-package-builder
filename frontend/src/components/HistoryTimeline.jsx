import "./HistoryTimeline.css";

function HistoryTimeline({ history }) {
  return (
    <div className="history-timeline">

      <h2 className="timeline-title">
        Order History Timeline
      </h2>

      <div className="timeline-container">

        {history.map((item, index) => (
          <div className="timeline-item" key={index}>

            <div className="timeline-circle"></div>

            <div className="timeline-content">

              <h3>{item.title}</h3>

              <p>{item.description}</p>

              <span className="timeline-date">
                {item.date}
              </span>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
}

export default HistoryTimeline;
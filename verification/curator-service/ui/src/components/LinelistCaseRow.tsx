import React from "react";

interface RowProps {
    case: Case
}

export interface Case {
    _id: string;
    outcome: string;
    date: Date;
}

export default class LinelistCaseRow extends React.Component<RowProps, {}> {
    render() {
        const c = this.props.case;
        return (
            <tr>
                <td>{c._id}</td>
                <td>{new Date(c.date).toDateString()}</td>
                <td>{c.outcome}</td>
            </tr>
        );
    }
}
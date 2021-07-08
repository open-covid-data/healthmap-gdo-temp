exports.handler = (event, context) => {
    if (
        event.request.privateChallengeParameters.secretLoginCode ===
        event.request.challengeAnswer
    ) {
        event.response.answerCorrect = true;
    } else {
        event.response.answerCorrect = false;
    }
    context.done(null, event);
};

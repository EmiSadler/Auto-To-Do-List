## To-Do Object
{
    id: string,                 //unique ID for this to-do item
    text: string,               //the to-do's display text
    done: boolean,              //check/unchecked state
    sourceEventId: string,      //the calendar event's Google-assigned ID
    sourceEventTitle: string,   //the meeting's raw title, e.g. "Waseem/Emily - Wellbeing Meeting"
    sourceMeetingType: string,  //classified type, e.g. "wellbeing"
    createdAt: number           //Date.now() timestamp when generated
}

## Triggered Event Record
{
    id: string                  //the calendar event's Google-assigned ID
    triggeredAt: number         //Date.now() timestamp when generated
}
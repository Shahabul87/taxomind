import { EventEmitter } from 'events';

type QAEvent = {
  type: 'answer_created' | 'question_updated' | 'vote_updated' | 'answer_marked_best';
  courseId: string;
  questionId: string;
  payload?: any;
};

class QAEventBus extends EventEmitter {
  emitEvent(event: QAEvent) {
    this.emit(`qa:${event.courseId}`, event);
  }

  onCourse(courseId: string, listener: (e: QAEvent) => void) {
    this.on(`qa:${courseId}`, listener);
    return () => this.off(`qa:${courseId}`, listener);
  }
}

export const qaEventBus = new QAEventBus();


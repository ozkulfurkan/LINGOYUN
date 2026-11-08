import { COURSES, courseId, coursesFor, findCourse } from './courses';
import { isLanguageCode } from './registry';

describe('courses', () => {
  it('builds ids from the language pair', () => {
    expect(courseId('tr', 'en')).toBe('tr-en');
  });

  it('finds the Turkish → English course', () => {
    const course = findCourse('tr-en');
    expect(course?.nativeLang).toBe('tr');
    expect(course?.targetLang).toBe('en');
    expect(findCourse('tr-de')).toBeUndefined();
  });

  it('lists courses by native language', () => {
    expect(coursesFor('tr').map((c) => c.id)).toEqual(['tr-en']);
    expect(coursesFor('en')).toEqual([]);
  });

  it.each(COURSES)('$id is consistent', (course) => {
    expect(isLanguageCode(course.nativeLang)).toBe(true);
    expect(isLanguageCode(course.targetLang)).toBe(true);
    expect(course.nativeLang).not.toBe(course.targetLang);
    expect(course.id).toBe(courseId(course.nativeLang, course.targetLang));
    for (const scale of Object.values(course.levels)) {
      expect(scale.length).toBeGreaterThan(0);
      expect(new Set(scale).size).toBe(scale.length);
    }
  });

  it('has unique course ids', () => {
    const ids = COURSES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

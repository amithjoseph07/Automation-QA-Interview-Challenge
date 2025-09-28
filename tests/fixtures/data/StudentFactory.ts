import { faker } from '@faker-js/faker';

export class StudentFactory {
  static generateAdultStudent() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const fullName = `${firstName} ${lastName}`;
    const email = faker.internet.email({ firstName, lastName });
    const phone = faker.phone.number({ style: 'national' });

    return { fullName, email, phone, type: 'Adult' };
  }

  static generateChildStudent() {
    const childFirstName = faker.person.firstName();
    const childLastName = faker.person.lastName();
    const childFullName = `${childFirstName} ${childLastName}`;
    const childEmail = faker.internet.email({ firstName: childFirstName, lastName: childLastName });

    const parentFirstName = faker.person.firstName();
    const parentLastName = faker.person.lastName();
    const parentFullName = `${parentFirstName} ${parentLastName}`;

    const phone = faker.phone.number({ style: 'national' });

    return {
      fullName: childFullName,
      email: childEmail,
      phone,
      type: 'Child',
      parent: parentFullName,
    };
  }
}

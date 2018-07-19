/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getParticipantRegistry */

/**
 * Process book lend/return to/from a lendee
 * @param {org.seon.lend.book.Circulate} data - lend/return data
 * @transaction
 */
async function circulate(data) {
  if(data.action === 'LEND' && data.book.status === 'AVAILABLE') {
    // process borrow
    if(data.lendee.remaining == 0) {
      throw new Error('Cannot lend anymore');
    }
    
    data.book.possessedBy = data.lendee;
    data.book.processedBy = data.librarian;
    
    switch(data.book.category) {
      case 'COMIC':
        data.book.daysLeft = 5;
        break;
      case 'LITERATURE':
        data.book.daysLeft = 14;
        break;
      case 'TEXTBOOK':
        data.book.daysLeft = 60;
        break;
    }
    
    data.book.status = 'LENT_OUT';
    data.lendee.remaining--;
  }
  else if(data.action === 'RETURN' && data.book.status === 'LENT_OUT') {
    // process return
    data.book.possessedBy = data.book.ownedBy;
    data.book.processedBy = data.librarian;
    data.book.status = 'AVAILABLE';
    data.lendee.remaining++;
  }
  else {
    throw new Error('Cannot ' + data.action + ' because this book is ' + data.status);
  }
  
  const bookRegistry = await getAssetRegistry('org.seon.lend.book.Book');
  await bookRegistry.update(data.book);
  
  const lendeeRegistry = await getParticipantRegistry('org.seon.lend.book.Lendee');
  await lendeeRegistry.update(data.lendee);
}
import { AxiosError } from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import {
  BellaturaUserGetGenerations,
  BellaturaUserGetMyData,
} from '@/utils/fetch/belatura/users';
import styles from '@/styles/Tree.module.css';
import AppHead from '@/components/AppHead/AppHead';
import AppWrapper from '@/components/AppWrapper/AppWrapper';
import { faEnvelope } from '@fortawesome/free-solid-svg-icons';
import { faTelegram } from '@fortawesome/free-brands-svg-icons';
import { BellaturaUserGetDto } from '@/types/belatura/api/users';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import AppContainer from '@/components/AppContainer/AppContainer';

export default function AccountPage() {
  const route = useRouter();

  const [isLogin, setIsLogin] = useState<boolean>(false);
  const [userId, setUserId] = useState<number>(0);
  const [generations, setGenerations] = useState<number>(100);
  const [lst, setLst] = useState<BellaturaUserGetDto[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('access') || '';
    if (accessToken.length === 0) {
      setIsLogin(false);
      return;
    }
    setIsLogin(true);

    (async function () {
      try {
        const jData = await BellaturaUserGetMyData();
        const data = jData.data;
        const userId = data.rs_id;
        setUserId(userId);
        setIsLoaded(true);
      } catch (exception) {
        if (
          exception instanceof AxiosError &&
          exception.response &&
          exception.response.status === 401
        ) {
          route.replace('/sign-in');
        }
      }
    })();
  }, []);

  async function getGenerations() {
    try {
      if (generations <= 0) {
        setGenerations(1);
        return;
      }

      if (!isLoaded) {
        return;
      }

      const jData = await BellaturaUserGetGenerations(userId, generations);
      setLst(jData.data);
    } catch (exception) {
      alert(exception);
    }
  }

  useEffect(() => {
    getGenerations();
  }, [generations, isLoaded]);

  if (isLogin) {
    return (
      <AppHead title="Иерархия клиентов" description="Иерархия клиентов">
        <AppWrapper>
          <AppContainer>
            <h1>Иерархия клиентов</h1>
            <div className={styles.tree__input_b}>
              <label htmlFor="generations" className={styles.tree__label}>
                Введите количество поколений
              </label>
              <input
                id="generations"
                type="text"
                value={generations}
                onChange={(event) =>
                  setGenerations(Number(event.target.value.replace(/\D/g, '')))
                }
                className={styles.tree__input}
              />
            </div>
            <Tree userId={userId} lst={lst} />
          </AppContainer>
        </AppWrapper>
      </AppHead>
    );
  }

  return (
    <AppHead title="Иерархия клиентов" description="Иерархия клиентов">
      <AppWrapper>
        <AppContainer>
          <h1>Иерархия клиентов</h1>
          <h2>Вы не вошли в аккаунт</h2>
        </AppContainer>
      </AppWrapper>
    </AppHead>
  );
}

interface ITree {
  userId: number;
  lst: BellaturaUserGetDto[];
}

// function Tree(props: ITree) {
//   const candidate = props.lst.find((e) => e.rs_id === props.userId);

//   if (!candidate) return null;

//   return (
//     <div className={styles.tree__wrapper}>
//       <ul className={styles.tree__ul}>
//         <li className={styles.tree__li}>
//           <div className={styles.tree__block}>
//             <div>
//               {[
//                 candidate.rs_surname,
//                 candidate.rs_name,
//                 candidate.rs_middlename,
//               ]
//                 .filter((e) => e.length > 0)
//                 .join(' ')}
//             </div>
//             <div className={styles.tree__copy_b}>
//               {candidate.rs_telegramNickname ? (
//                 <CopyToClipboard
//                   text={candidate.rs_telegramNickname}
//                   onCopy={() =>
//                     alert(
//                       `Телеграм никнейм скопирован:\n${candidate.rs_telegramNickname}\nhttps://t.me/${candidate.rs_telegramNickname}`,
//                     )
//                   }>
//                   <button className={styles.form__button}>
//                     <FontAwesomeIcon icon={faTelegram} />
//                   </button>
//                 </CopyToClipboard>
//               ) : null}
//               <CopyToClipboard
//                 text={candidate.rs_email}
//                 onCopy={() =>
//                   alert(`Скопирована электронная почта:\n${candidate.rs_email}`)
//                 }>
//                 <button className={styles.form__button}>
//                   <FontAwesomeIcon icon={faEnvelope} />
//                 </button>
//               </CopyToClipboard>
//             </div>
//           </div>
//           <GetTreeNode userRef={props.userId} lst={props.lst} />
//         </li>
//       </ul>
//     </div>
//   );
// }

function Tree(props: ITree) {
  const candidate = props.lst.find((e) => e.rs_id === props.userId);

  if (!candidate) return null;
  const fio = [candidate.rs_surname, candidate.rs_name, candidate.rs_middlename]
    .filter((e) => e.length > 0)
    .join(' ');

  const telegramNick = candidate.rs_telegramNickname
    .replace('@', '')
    .replace('https://t.me/', '');

    let countRef = 0;
    const lst = props.lst;
  for (let i = 0; i < lst.length; ++i) {
    if (lst[i].rs_ref === candidate.rs_id) {
      countRef += 1;
    }
  }

  return (
    <div className={styles.tree__out_wrapper}>
      <details
        key={candidate.rs_id}
        className={styles.tree__details}
        open={true}>
        <summary className={styles.tree__summary}>[Я] {candidate.rs_id} {fio} ({countRef} чел.)</summary>
        
        <div className={styles.tree__buttons}>
            {candidate.rs_telegramNickname ? (
              <CopyToClipboard
                text={candidate.rs_telegramNickname}
                onCopy={() =>
                  alert(
                    `Телеграм никнейм скопирован:\n${candidate.rs_telegramNickname}\n\n${telegramNick}\nhttps://t.me/${telegramNick}`,
                  )
                }>
                <button className={`${styles.form__button} ${styles['form__button--telegram']}`}>
                  <FontAwesomeIcon icon={faTelegram} />
                </button>
              </CopyToClipboard>
            ) : null}
            <CopyToClipboard
              text={candidate.rs_email}
              onCopy={() =>
                alert(`Скопирована электронная почта:\n${candidate.rs_email}`)
              }>
              <button className={styles.form__button}>
                <FontAwesomeIcon icon={faEnvelope} />
              </button>
            </CopyToClipboard>
          </div>

        <GetTreeNode userRef={props.userId} lst={props.lst} generations={1} />
      </details>
    </div>
  );
}

interface IGEtTreeNode {
  userRef: number;
  lst: BellaturaUserGetDto[];
  generations: number;
}

// function GetTreeNode(props: IGEtTreeNode) {
//   return (
//     <ul className={styles.tree__ul}>
//       {props.lst
//         .filter((e) => e.rs_ref === props.userRef)
//         .map((e) => {
//           return (
//             <li key={e.rs_id} className={styles.tree__li}>
//               <div className={styles.tree__block}>
//                 <div>
//                   {[e.rs_surname, e.rs_name, e.rs_middlename]
//                     .filter((e) => e.length > 0)
//                     .join(' ')}
//                 </div>
//                 <div className={styles.tree__copy_b}>
//                   {e.rs_telegramNickname ? (
//                     <CopyToClipboard
//                       text={e.rs_telegramNickname}
//                       onCopy={() =>
//                         alert(
//                           `Телеграм никнейм скопирован:\n${e.rs_telegramNickname}\nhttps://t.me/${e.rs_telegramNickname}`,
//                         )
//                       }>
//                       <button className={styles.form__button}>
//                         <FontAwesomeIcon icon={faTelegram} />
//                       </button>
//                     </CopyToClipboard>
//                   ) : null}
//                   <CopyToClipboard
//                     text={e.rs_email}
//                     onCopy={() =>
//                       alert(`Скопирована электронная почта:\n${e.rs_email}`)
//                     }>
//                     <button className={styles.form__button}>
//                       <FontAwesomeIcon icon={faEnvelope} />
//                     </button>
//                   </CopyToClipboard>
//                 </div>
//               </div>
//               <GetTreeNode userRef={e.rs_id} lst={props.lst} />
//             </li>
//           );
//         })}
//     </ul>
//   );
// }

function GetTreeNode(props: IGEtTreeNode) {
  return props.lst
    .filter((candidate) => candidate.rs_ref === props.userRef)
    .map((candidate) => {
      const fio = [
        candidate.rs_surname,
        candidate.rs_name,
        candidate.rs_middlename,
      ]
        .filter((arr) => arr.length > 0)
        .join(' ');

      const telegramNick = candidate.rs_telegramNickname
        .replace('@', '')
        .replace('https://t.me/', '');

        let countRef = 0;
        const lst = props.lst;
      for (let i = 0; i < lst.length; ++i) {
        if (lst[i].rs_ref === candidate.rs_id) {
          countRef += 1;
        }
      }

      return (
        <details
          key={candidate.rs_id}
          className={styles.tree__details}>
          <summary className={styles.tree__summary}>
            [{props.generations}] {candidate.rs_id} {fio} ({countRef} чел.)
          </summary>

          <div className={styles.tree__buttons}>
            {candidate.rs_telegramNickname ? (
              <CopyToClipboard
                text={candidate.rs_telegramNickname}
                onCopy={() =>
                  alert(
                    `Телеграм никнейм скопирован:\n${candidate.rs_telegramNickname}\n\n${telegramNick}\nhttps://t.me/${telegramNick}`,
                  )
                }>
                <button className={`${styles.form__button} ${styles['form__button--telegram']}`}>
                  <FontAwesomeIcon icon={faTelegram} />
                </button>
              </CopyToClipboard>
            ) : null}
            <CopyToClipboard
              text={candidate.rs_email}
              onCopy={() =>
                alert(`Скопирована электронная почта:\n${candidate.rs_email}`)
              }>
              <button className={styles.form__button}>
                <FontAwesomeIcon icon={faEnvelope} />
              </button>
            </CopyToClipboard>
          </div>

          <GetTreeNode
            userRef={candidate.rs_id}
            lst={props.lst}
            generations={props.generations + 1}
          />
        </details>
      );
    });
}

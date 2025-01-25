import Dialog from '@mui/material/Dialog';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import OurWordmark from '../../components/OurWordmark';
import {useOscarAppContext} from '../../providers/AppContext';
import SignUp from './SignupForm';
import UserProfile from './UserProfile';

// const Card = styled(MuiCard)(({theme}) => ({
//   display: 'flex',
//   flexDirection: 'column',
//   width: '100%',
//   padding: theme.spacing(4),
//   gap: theme.spacing(2),
//   position: 'absolute',
//   top: '50%',
//   left: '50%',
//   transform: 'translate(-50%, -50%)',
//   [theme.breakpoints.up('sm')]: {
//     maxWidth: '450px',
//   },
//   boxShadow:
//     'hsla(220, 30%, 5%, 0.05) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.05) 0px 15px 35px -5px',
//   ...theme.applyStyles('dark', {
//     boxShadow:
//       'hsla(220, 30%, 5%, 0.5) 0px 5px 15px 0px, hsla(220, 25%, 10%, 0.08) 0px 15px 35px -5px',
//   }),
// }));

// const ActiveUserDataContainer = styled(Stack)(({theme}) => ({
//   height: 'calc((1 - var(--template-frame-height, 0)) * 100dvh)',
//   minHeight: '100%',
//   padding: theme.spacing(2),
//   [theme.breakpoints.up('sm')]: {
//     padding: theme.spacing(4),
//   },
//   '&::before': {
//     content: '""',
//     display: 'block',
//     position: 'absolute',
//     zIndex: -1,
//     inset: 0,
//     backgroundImage:
//       'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))',
//     backgroundRepeat: 'no-repeat',
//     ...theme.applyStyles('dark', {
//       backgroundImage:
//         'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))',
//     }),
//   },
// }));

type Props = {
  open: boolean;
  // setOpen: (open: boolean) => void;
  closeModal: () => void;
};

function ProfileScreenContents({closeModal}: {closeModal: () => void}) {
  const {activeUserId} = useOscarAppContext();
  if (!activeUserId) {
    return <SignUp closer={closeModal} />;
  } else {
    return <UserProfile closer={closeModal} />;
  }
}

export default function ProfileScreen({open, closeModal}: Props) {
  return (
    <Dialog
      open={open}
      onClose={closeModal}
      sx={{
        '& .MuiDialog-paper': {
          backgroundColor: 'background',
          borderRadius: '2ch',
        },
      }}
      // slots={{
      //   backdrop: Backdrop,
      // }}
      // slotProps={{
      //   backdrop: {
      //     sx: {
      //       color: '#fff',
      //       opacity: 1,
      //       display: 'flex',
      //       alignItems: 'center',
      //       justifyContent: 'center',
      //       maxHeight: '100vh',
      //       overflowY: 'auto',
      //     },
      //   },
      // }}
    >
      <Card
        variant="outlined"
        color="primary"
        sx={{
          // backgroundColor: 'primary.main',
          // opacity: 1,
          borderRadius: '2ch',
          padding: '12px',
        }}>
        <Stack>
          <Stack direction="row" justifyContent="space-between">
            <OurWordmark folded />
            <IconButton onClick={closeModal}>
              <CloseIcon />
            </IconButton>
          </Stack>
          <ProfileScreenContents closeModal={closeModal} />
        </Stack>
      </Card>
    </Dialog>
  );
}

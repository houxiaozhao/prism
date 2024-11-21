import {LinkExternalIcon, MarkGithubIcon, PlusIcon, TrashIcon} from '@primer/octicons-react'
import {
  Box,
  Button,
  Heading,
  IconButton as PrimerIconButton,
  Label,
  Link as PrimerLink,
  StyledOcticon,
  Text
} from '@primer/react'
import {Link, RouteComponentProps} from '@reach/router'
import {mix, readableColor} from 'color2k'
import {IconButton} from '../components/button'
import {routePrefix} from '../constants'
import {useGlobalState} from '../global-state'
import {colorToHex, getColor} from '../utils'

export function Index(props: RouteComponentProps) {
  const [state, send] = useGlobalState()
  return (
    <div>
      <Box
        as="header"
        sx={{
          p: 3,
          bg: 'canvas.default',
          display: 'flex',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{display: 'flex', alignItems: 'center'}}>
          <MarkGithubIcon size={32} />
          <Box as="h1" sx={{m: 0, mx: 2, fontSize: 3, fontWeight: 'bold'}}>
            Primer Prism
          </Box>
        </Box>
        <Box sx={{display: 'flex', alignItems: 'center'}}>
          <PrimerIconButton
            aria-label="创建新调色板"
            icon={PlusIcon}
            onClick={() => send('CREATE_PALETTE')}
            sx={{margin: 0}}
          />
        </Box>
      </Box>
      <Box sx={{p: 3}}>
        <Box
          as="ul"
          sx={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'grid',
            gap: 3,
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            lineClamp: 1
          }}
        >
          {Object.values(state.context.palettes).map(palette => (
            <li key={palette.id} style={{position: 'relative'}}>
              <Box
                as={Link}
                to={`${routePrefix}/local/${palette.id}`}
                p={3}
                sx={{
                  display: 'grid',
                  gap: 3,
                  textDecoration: 'none',
                  borderRadius: 2,
                  // border: "1px solid",
                  // borderColor: "border.default",
                  overflow: 'hidden',
                  color: readableColor(palette.backgroundColor),
                  backgroundColor: palette.backgroundColor,
                  height: '100%'
                }}
              >
                <Box
                  sx={{
                    borderRadius: 1,
                    overflow: 'hidden',
                    display: 'flex',
                    height: 160,
                    gap: 3
                  }}
                >
                  {Object.values(palette.scales)
                    .slice(0, 12)
                    .map(scale => (
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          color: readableColor(palette.backgroundColor),
                          backgroundColor: palette.backgroundColor,
                          height: '100%',
                          width: '100%',
                          borderRadius: 1,
                          overflow: 'hidden'
                        }}
                        key={scale.id}
                      >
                        {scale.colors.map((_, index) => {
                          const color = getColor(palette.curves, scale, index)
                          return (
                            <Box
                              key={index}
                              style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: colorToHex(color)
                              }}
                            />
                          )
                        })}
                      </Box>
                    ))}
                </Box>
                <Text
                  sx={{
                    lineHeight: '24px',
                    textOverflow: 'ellipsis',
                    width: '80%',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {palette.name}
                </Text>
              </Box>
              <IconButton
                aria-label="删除调色板"
                icon={TrashIcon}
                onClick={() => {
                  send({type: 'DELETE_PALETTE', paletteId: palette.id})
                }}
                sx={{
                  '--color-text': readableColor(palette.backgroundColor),
                  '--color-background': palette.backgroundColor,
                  '--color-background-secondary': mix(
                    readableColor(palette.backgroundColor),
                    palette.backgroundColor,
                    0.9
                  ),
                  '--color-background-secondary-hover': mix(
                    readableColor(palette.backgroundColor),
                    palette.backgroundColor,
                    0.85
                  ),
                  '--color-border': mix(readableColor(palette.backgroundColor), palette.backgroundColor, 0.75),
                  position: 'absolute',
                  right: 3,
                  bottom: '12px'
                }}
              />
            </li>
          ))}
        </Box>
      </Box>
      {/* Empty state */}
      {Object.keys(state.context.palettes).length === 0 ? (
        <Box
          sx={{
            height: '70vh',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Box
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'center',
              flexDirection: 'column',
              textAlign: 'center',
              maxWidth: '50ch'
            }}
          >
            <Heading as="h2" sx={{marginBottom: 1}}>
              欢迎使用
            </Heading>
            <Text sx={{marginBottom: 5, fontSize: 3, color: 'fg.muted'}}>
              Primer Prism 是一个用于创建和谐、一致且易于访问的调色板的工具
            </Text>
            <Button variant="primary" size="large" onClick={() => send('CREATE_PALETTE')}>
              创建新调色板
            </Button>
          </Box>
        </Box>
      ) : null}
    </div>
  )
}

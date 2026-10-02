import { useEffect, useState, type ReactNode } from 'react';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Gamepad2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type ServiceArea =
  | 'geral'
  | 'amor'
  | 'financeiro'
  | 'pessoal'
  | 'espiritual'
  | 'relacionamentos';

type Review = {
  id: number;
  estrelas: number;
  comentario: string;
  status: 'pendente' | 'aprovada' | 'rejeitada';
  destaque: boolean;
  created_at: string;
};

type Service = {
  id: number;
  nome: string;
  preco: number;
  descricao: string;
  categoria: 'consulta' | 'tiragem';
  area: ServiceArea | null;
  ativo: boolean;
  destaque: boolean;
  ordem: number;
  created_at: string;
};

type ServiceForm = {
  nome: string;
  preco: string;
  descricao: string;
  categoria: 'consulta' | 'tiragem';
  area: ServiceArea;
  ativo: boolean;
  destaque: boolean;
  ordem: string;
};

type Filter =
  | 'pendente'
  | 'aprovada'
  | 'rejeitada';

type AdminTab =
  | 'avaliacoes'
  | 'jogos'
  | 'pedidos'
  | 'agenda';

type AvailabilityDay = {
  id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

type Appointment = {
  id: number;
  order_id: number;
  start_at: string;
  end_at: string;
  duration_minutes: number;
  status:
    | 'reservado'
    | 'confirmado'
    | 'em_atendimento'
    | 'concluido'
    | 'cancelado';
};

type ScheduleBlock = {
  id: number;
  start_at: string;
  end_at: string;
  reason: string | null;
};

type OrderItem = {
  id: number;
  service_name: string;
  category: 'consulta' | 'tiragem';
  unit_price: number;
  quantity: number;
  total_price: number;
  question: string | null;
  duration_minutes: number | null;
};

type Order = {
  id: number;
  user_id: string;
  status:
    | 'rascunho'
    | 'aguardando_pagamento'
    | 'pago'
    | 'em_atendimento'
    | 'finalizado'
    | 'cancelado';
  payment_status:
    | 'pendente'
    | 'pago'
    | 'falhou'
    | 'cancelado'
    | 'reembolsado';
  total: number;
  appointment_start_at: string | null;
  appointment_end_at: string | null;
  duration_minutes: number | null;
  created_at: string;
  order_items?: OrderItem[];
};

const emptyServiceForm: ServiceForm = {
  nome: '',
  preco: '',
  descricao: '',
  categoria: 'tiragem',
  area: 'geral',
  ativo: true,
  destaque: false,
  ordem: '1',
};

const areaOptions: Array<{
  value: ServiceArea;
  label: string;
}> = [
  { value: 'geral', label: 'Geral' },
  { value: 'amor', label: 'Amor' },
  {
    value: 'financeiro',
    label: 'Financeiro',
  },
  { value: 'pessoal', label: 'Pessoal' },
  {
    value: 'espiritual',
    label: 'Espiritual',
  },
  {
    value: 'relacionamentos',
    label: 'Relacionamentos',
  },
];

export function AdminPanel() {
  const [open, setOpen] = useState(false);

  const [tab, setTab] =
    useState<AdminTab>('avaliacoes');

  const [filter, setFilter] =
    useState<Filter>('pendente');

  const [reviews, setReviews] = useState<
    Review[]
  >([]);

  const [services, setServices] = useState<
    Service[]
  >([]);

  const [orders, setOrders] = useState<
    Order[]
  >([]);

  const [appointments, setAppointments] =
    useState<Appointment[]>([]);

  const [
    scheduleBlocks,
    setScheduleBlocks,
  ] = useState<ScheduleBlock[]>([]);

  const [
    availabilityDays,
    setAvailabilityDays,
  ] = useState<AvailabilityDay[]>([]);

  const [agendaDate, setAgendaDate] =
    useState(getTodayInSaoPaulo());

  const [
    agendaStartTime,
    setAgendaStartTime,
  ] = useState('10:00');

  const [
    agendaEndTime,
    setAgendaEndTime,
  ] = useState('10:30');

  const [
    agendaReason,
    setAgendaReason,
  ] = useState('');

  const [
    showAvailabilitySettings,
    setShowAvailabilitySettings,
  ] = useState(false);

  const [
    savingAvailabilityDay,
    setSavingAvailabilityDay,
  ] = useState<number | null>(null);

  const [savingBlock, setSavingBlock] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [actionId, setActionId] =
    useState<number | null>(null);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [
    serviceModalOpen,
    setServiceModalOpen,
  ] = useState(false);

  const [
    editingService,
    setEditingService,
  ] = useState<Service | null>(null);

  const [serviceForm, setServiceForm] =
    useState<ServiceForm>(
      emptyServiceForm
    );

  const [
    savingService,
    setSavingService,
  ] = useState(false);

  useEffect(() => {
    const handleOpen = () => setOpen(true);

    document.addEventListener(
      'open-admin-panel',
      handleOpen
    );

    return () =>
      document.removeEventListener(
        'open-admin-panel',
        handleOpen
      );
  }, []);

  useEffect(() => {
    document.body.style.overflow =
      open || serviceModalOpen
        ? 'hidden'
        : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [open, serviceModalOpen]);

  useEffect(() => {
    if (!open) return;

    if (tab === 'avaliacoes') {
      loadReviews();
    }

    if (tab === 'jogos') {
      loadServices();
    }

    if (tab === 'pedidos') {
      loadOrders();
    }

    if (tab === 'agenda') {
      loadAgenda();
    }
  }, [open, tab, filter]);

  useEffect(() => {
    if (
      open &&
      tab === 'agenda'
    ) {
      loadAgenda();
    }
  }, [agendaDate]);

  function clearMessages() {
    setError('');
    setSuccess('');
  }

  async function loadReviews() {
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('reviews')
        .select(
          'id, estrelas, comentario, status, destaque, created_at'
        )
        .eq('status', filter)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(error);
      setReviews([]);

      setError(
        'Não foi possível carregar as avaliações.'
      );
    } else {
      setReviews(
        (data ?? []) as Review[]
      );
    }

    setLoading(false);
  }

  async function loadServices() {
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('services')
        .select(
          'id, nome, preco, descricao, categoria, area, ativo, destaque, ordem, created_at'
        )
        .order('categoria', {
          ascending: true,
        })
        .order('ordem', {
          ascending: true,
        });

    if (error) {
      console.error(error);

      setServices([]);

      setError(
        'Não foi possível carregar os jogos.'
      );
    } else {
      setServices(
        (data ?? []) as Service[]
      );
    }

    setLoading(false);
  }

  async function loadOrders() {
    setLoading(true);
    setError('');

    const { data, error } =
      await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          payment_status,
          total,
          appointment_start_at,
          appointment_end_at,
          duration_minutes,
          created_at,
          order_items (
            id,
            service_name,
            category,
            unit_price,
            quantity,
            total_price,
            question,
            duration_minutes
          )
        `)
        .order('created_at', {
          ascending: false,
        });

    if (error) {
      console.error(error);

      setOrders([]);

      setError(
        'Não foi possível carregar os pedidos.'
      );
    } else {
      setOrders(
        (data ?? []) as Order[]
      );
    }

    setLoading(false);
  }

  async function loadAgenda() {
    setLoading(true);
    setError('');

    const { startIso, endIso } =
      getSaoPauloDayRange(
        agendaDate
      );

    const [
      appointmentsResult,
      blocksResult,
      availabilityResult,
    ] = await Promise.all([
      supabase
        .from('appointments')
        .select(
          'id, order_id, start_at, end_at, duration_minutes, status'
        )
        .gte(
          'start_at',
          startIso
        )
        .lt(
          'start_at',
          endIso
        )
        .neq(
          'status',
          'cancelado'
        )
        .order('start_at', {
          ascending: true,
        }),

      supabase
        .from('schedule_blocks')
        .select(
          'id, start_at, end_at, reason'
        )
        .lt(
          'start_at',
          endIso
        )
        .gt(
          'end_at',
          startIso
        )
        .order('start_at', {
          ascending: true,
        }),

      supabase
        .from('availability')
        .select(
          'id, day_of_week, start_time, end_time, active'
        )
        .order('day_of_week', {
          ascending: true,
        }),
    ]);

    if (
      appointmentsResult.error
    ) {
      console.error(
        appointmentsResult.error
      );

      setAppointments([]);

      setError(
        'Não foi possível carregar os atendimentos da agenda.'
      );
    } else {
      setAppointments(
        (appointmentsResult.data ??
          []) as Appointment[]
      );
    }

    if (blocksResult.error) {
      console.error(
        blocksResult.error
      );

      setScheduleBlocks([]);

      setError(
        'Não foi possível carregar os bloqueios da agenda.'
      );
    } else {
      setScheduleBlocks(
        (blocksResult.data ??
          []) as ScheduleBlock[]
      );
    }

    if (
      availabilityResult.error
    ) {
      console.error(
        availabilityResult.error
      );

      setAvailabilityDays([]);

      setError(
        'Não foi possível carregar os horários de atendimento.'
      );
    } else {
      setAvailabilityDays(
        (availabilityResult.data ??
          []) as AvailabilityDay[]
      );
    }

    setLoading(false);
  }

  async function updateReview(
    id: number,
    changes: Partial<
      Pick<
        Review,
        'status' | 'destaque'
      >
    >
  ) {
    setActionId(id);
    setError('');

    const { error } =
      await supabase
        .from('reviews')
        .update(changes)
        .eq('id', id);

    if (error) {
      setError(
        'Não foi possível alterar essa avaliação.'
      );
    } else {
      await loadReviews();
    }

    setActionId(null);
  }

  async function deleteReview(
    id: number
  ) {
    if (
      !window.confirm(
        'Deseja realmente excluir esta avaliação?'
      )
    ) {
      return;
    }

    setActionId(id);

    const { error } =
      await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

    if (error) {
      setError(
        'Não foi possível excluir essa avaliação.'
      );
    } else {
      await loadReviews();
    }

    setActionId(null);
  }

  function openNewService() {
    setEditingService(null);

    setServiceForm({
      ...emptyServiceForm,
      ordem: String(
        services.length + 1
      ),
    });

    clearMessages();

    setServiceModalOpen(true);
  }

  function openEditService(
    service: Service
  ) {
    setEditingService(service);

    setServiceForm({
      nome: service.nome,
      preco: String(
        service.preco
      ),
      descricao:
        service.descricao,
      categoria:
        service.categoria,
      area:
        service.area ??
        'geral',
      ativo:
        service.ativo,
      destaque:
        service.destaque,
      ordem: String(
        service.ordem
      ),
    });

    clearMessages();

    setServiceModalOpen(true);
  }

  function closeServiceModal() {
    if (savingService) return;

    setServiceModalOpen(false);
    setEditingService(null);

    setServiceForm(
      emptyServiceForm
    );
  }

  async function saveService() {
    clearMessages();

    const nome =
      serviceForm.nome.trim();

    const descricao =
      serviceForm.descricao.trim();

    const preco = Number(
      serviceForm.preco
        .replace(',', '.')
        .replace('R$', '')
        .trim()
    );

    const ordem = Number(
      serviceForm.ordem
    );

    if (!nome) {
      setError(
        'Informe o nome do jogo.'
      );
      return;
    }

    if (
      !Number.isFinite(preco) ||
      preco < 0
    ) {
      setError(
        'Informe um preço válido.'
      );
      return;
    }

    if (!descricao) {
      setError(
        'Informe a descrição do jogo.'
      );
      return;
    }

    if (
      !Number.isInteger(ordem) ||
      ordem < 1
    ) {
      setError(
        'A ordem precisa ser um número inteiro maior que zero.'
      );
      return;
    }

    setSavingService(true);

    const payload = {
      nome,
      preco,
      descricao,
      categoria:
        serviceForm.categoria,

      area:
        serviceForm.categoria ===
        'tiragem'
          ? serviceForm.area
          : 'geral',

      ativo:
        serviceForm.ativo,

      destaque:
        serviceForm.destaque,

      ordem,
    };

    const result =
      editingService
        ? await supabase
            .from('services')
            .update(payload)
            .eq(
              'id',
              editingService.id
            )
        : await supabase
            .from('services')
            .insert(payload);

    if (result.error) {
      console.error(
        result.error
      );

      setError(
        editingService
          ? 'Não foi possível salvar as alterações.'
          : 'Não foi possível criar o novo jogo.'
      );

      setSavingService(false);
      return;
    }

    const wasEditing =
      Boolean(
        editingService
      );

    setSavingService(false);

    setServiceModalOpen(
      false
    );

    setEditingService(null);

    setServiceForm(
      emptyServiceForm
    );

    setSuccess(
      wasEditing
        ? 'Jogo atualizado com sucesso ✦'
        : 'Novo jogo criado com sucesso ✦'
    );

    await loadServices();

    document.dispatchEvent(
      new CustomEvent(
        'services-updated'
      )
    );
  }

  async function toggleService(
    service: Service
  ) {
    setActionId(
      service.id
    );

    const { error } =
      await supabase
        .from('services')
        .update({
          ativo:
            !service.ativo,
        })
        .eq(
          'id',
          service.id
        );

    if (error) {
      setError(
        'Não foi possível alterar a disponibilidade.'
      );
    } else {
      await loadServices();
    }

    setActionId(null);
  }

  async function toggleHighlight(
    service: Service
  ) {
    setActionId(
      service.id
    );

    const { error } =
      await supabase
        .from('services')
        .update({
          destaque:
            !service.destaque,
        })
        .eq(
          'id',
          service.id
        );

    if (error) {
      setError(
        'Não foi possível alterar o destaque.'
      );
    } else {
      await loadServices();
    }

    setActionId(null);
  }

  async function deleteService(
    service: Service
  ) {
    const confirmed =
      window.confirm(
        `Deseja realmente excluir "${service.nome}"?\n\nEssa ação não poderá ser desfeita.`
      );

    if (!confirmed) return;

    setActionId(
      service.id
    );

    const { error } =
      await supabase
        .from('services')
        .delete()
        .eq(
          'id',
          service.id
        );

    if (error) {
      setError(
        'Não foi possível excluir esse jogo.'
      );
    } else {
      await loadServices();

      document.dispatchEvent(
        new CustomEvent(
          'services-updated'
        )
      );
    }

    setActionId(null);
  }

  async function confirmOrderPayment(
    order: Order
  ) {
    if (
      !window.confirm(
        `Confirmar o pagamento do pedido #${order.id}?`
      )
    ) {
      return;
    }

    setActionId(order.id);
    clearMessages();

    const {
      error: orderError,
    } = await supabase
      .from('orders')
      .update({
        status: 'pago',
        payment_status:
          'pago',
        paid_at:
          new Date().toISOString(),
      })
      .eq('id', order.id);

    if (orderError) {
      setError(
        'Não foi possível confirmar o pagamento.'
      );

      setActionId(null);
      return;
    }

    const {
      error:
        appointmentError,
    } = await supabase
      .from('appointments')
      .update({
        status:
          'confirmado',
      })
      .eq(
        'order_id',
        order.id
      );

    if (
      appointmentError
    ) {
      await supabase
        .from('orders')
        .update({
          status:
            'aguardando_pagamento',
          payment_status:
            'pendente',
          paid_at: null,
        })
        .eq(
          'id',
          order.id
        );

      setError(
        'Não foi possível confirmar o horário. O pedido não foi alterado.'
      );

      setActionId(null);
      return;
    }

    setSuccess(
      `Pagamento do pedido #${order.id} confirmado ✦`
    );

    await loadOrders();

    setActionId(null);
  }

  async function cancelOrder(
    order: Order
  ) {
    if (
      !window.confirm(
        `Cancelar o pedido #${order.id}?\n\nO horário reservado será liberado novamente no site.`
      )
    ) {
      return;
    }

    setActionId(order.id);
    clearMessages();

    const {
      error:
        appointmentError,
    } = await supabase
      .from('appointments')
      .update({
        status:
          'cancelado',
      })
      .eq(
        'order_id',
        order.id
      );

    if (
      appointmentError
    ) {
      setError(
        'Não foi possível liberar o horário deste pedido.'
      );

      setActionId(null);
      return;
    }

    const {
      error: orderError,
    } = await supabase
      .from('orders')
      .update({
        status:
          'cancelado',

        payment_status:
          order.payment_status ===
          'pago'
            ? 'reembolsado'
            : 'cancelado',
      })
      .eq(
        'id',
        order.id
      );

    if (orderError) {
      await supabase
        .from('appointments')
        .update({
          status:
            order.payment_status ===
            'pago'
              ? 'confirmado'
              : 'reservado',
        })
        .eq(
          'order_id',
          order.id
        );

      setError(
        'Não foi possível cancelar o pedido.'
      );

      setActionId(null);
      return;
    }

    setSuccess(
      `Pedido #${order.id} cancelado. O horário foi liberado.`
    );

    await loadOrders();

    setActionId(null);
  }

  function updateAvailabilityLocal(
    dayOfWeek: number,
    changes: Partial<
      Pick<
        AvailabilityDay,
        | 'start_time'
        | 'end_time'
        | 'active'
      >
    >
  ) {
    setAvailabilityDays(
      (current) =>
        current.map(
          (day) =>
            day.day_of_week ===
            dayOfWeek
              ? {
                  ...day,
                  ...changes,
                }
              : day
        )
    );
  }

  async function saveAvailabilityDay(
    day: AvailabilityDay
  ) {
    clearMessages();

    if (
      day.active &&
      day.end_time <=
        day.start_time
    ) {
      setError(
        `${getWeekdayName(
          day.day_of_week
        )}: o horário final precisa ser depois do horário inicial.`
      );

      return;
    }

    setSavingAvailabilityDay(
      day.day_of_week
    );

    const { error } =
      await supabase
        .from('availability')
        .update({
          active:
            day.active,

          start_time:
            normalizeTimeForDatabase(
              day.start_time
            ),

          end_time:
            normalizeTimeForDatabase(
              day.end_time
            ),
        })
        .eq('id', day.id);

    if (error) {
      setError(
        `Não foi possível salvar ${getWeekdayName(
          day.day_of_week
        )}.`
      );
    } else {
      setSuccess(
        `${getWeekdayName(
          day.day_of_week
        )} atualizado com sucesso ✦`
      );
    }

    setSavingAvailabilityDay(
      null
    );

    await loadAgenda();
  }

  async function createScheduleBlock() {
    clearMessages();

    if (
      !agendaStartTime ||
      !agendaEndTime
    ) {
      setError(
        'Informe o início e o fim do bloqueio.'
      );
      return;
    }

    if (
      agendaEndTime <=
      agendaStartTime
    ) {
      setError(
        'O horário final precisa ser depois do horário inicial.'
      );
      return;
    }

    const startAt =
      saoPauloLocalToIso(
        agendaDate,
        agendaStartTime
      );

    const endAt =
      saoPauloLocalToIso(
        agendaDate,
        agendaEndTime
      );

    const startMs =
      new Date(
        startAt
      ).getTime();

    const endMs =
      new Date(
        endAt
      ).getTime();

    const overlaps =
      appointments.some(
        (appointment) =>
          startMs <
            new Date(
              appointment.end_at
            ).getTime() &&
          endMs >
            new Date(
              appointment.start_at
            ).getTime()
      );

    if (overlaps) {
      setError(
        'Esse período já possui um atendimento reservado ou confirmado.'
      );
      return;
    }

    setSavingBlock(true);

    const { error } =
      await supabase
        .from(
          'schedule_blocks'
        )
        .insert({
          start_at:
            startAt,

          end_at:
            endAt,

          reason:
            agendaReason.trim() ||
            'Indisponível',
        });

    if (error) {
      setError(
        'Não foi possível bloquear esse horário.'
      );
    } else {
      setAgendaReason('');

      setSuccess(
        'Horário bloqueado. Ele não aparecerá mais para clientes ✦'
      );

      await loadAgenda();
    }

    setSavingBlock(false);
  }

  async function deleteScheduleBlock(
    block: ScheduleBlock
  ) {
    if (
      !window.confirm(
        'Liberar este período novamente para agendamentos?'
      )
    ) {
      return;
    }

    setActionId(
      block.id
    );

    const { error } =
      await supabase
        .from(
          'schedule_blocks'
        )
        .delete()
        .eq(
          'id',
          block.id
        );

    if (error) {
      setError(
        'Não foi possível liberar esse horário.'
      );
    } else {
      setSuccess(
        'Horário liberado novamente ✦'
      );

      await loadAgenda();
    }

    setActionId(null);
  }

  function changeAgendaDay(
    days: number
  ) {
    setAgendaDate(
      addDaysToDateString(
        agendaDate,
        days
      )
    );

    clearMessages();
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[110] overflow-y-auto bg-bordo-300">
        <div className="mx-auto min-h-screen w-full max-w-[480px] bg-bordo-300">
          <header className="sticky top-0 z-20 border-b border-dourado-200/15 bg-bordo-300/95 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-5">
              <div>
                <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-dourado-200/50">
                  ISLP Tarot
                </p>

                <h1 className="font-serif text-lg tracking-[0.1em] text-gradient-gold">
                  PAINEL ADMINISTRATIVO
                </h1>
              </div>

              <button
                type="button"
                onClick={() =>
                  setOpen(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-dourado-200/20 text-dourado-200/70"
                aria-label="Fechar painel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </header>

          <main className="px-5 py-7">
            <section className="rounded-2xl border border-dourado-200/20 bg-bordo-200/50 p-5">
              <p className="font-serif text-lg text-creme/90">
                Olá, Isis ✦
              </p>

              <p className="mt-1 font-serif text-xs uppercase tracking-[0.12em] text-dourado-200/50">
                Administradora
              </p>
            </section>

            <div className="mt-7 grid grid-cols-4 gap-2">
              <TabButton
                active={
                  tab ===
                  'avaliacoes'
                }
                onClick={() => {
                  setTab(
                    'avaliacoes'
                  );
                  clearMessages();
                }}
                icon={
                  <Star className="h-4 w-4" />
                }
              >
                Avaliações
              </TabButton>

              <TabButton
                active={
                  tab ===
                  'jogos'
                }
                onClick={() => {
                  setTab('jogos');
                  clearMessages();
                }}
                icon={
                  <Gamepad2 className="h-4 w-4" />
                }
              >
                Jogos
              </TabButton>

              <TabButton
                active={
                  tab ===
                  'pedidos'
                }
                onClick={() => {
                  setTab('pedidos');
                  clearMessages();
                }}
                icon={
                  <PackageCheck className="h-4 w-4" />
                }
              >
                Pedidos
              </TabButton>

              <TabButton
                active={
                  tab ===
                  'agenda'
                }
                onClick={() => {
                  setTab('agenda');
                  clearMessages();
                }}
                icon={
                  <CalendarDays className="h-4 w-4" />
                }
              >
                Agenda
              </TabButton>
            </div>

            <Messages
              error={error}
              success={success}
            />

            {tab ===
              'avaliacoes' && (
              <section className="mt-8">
                <SectionTitle
                  title="Avaliações"
                  onRefresh={
                    loadReviews
                  }
                  loading={
                    loading
                  }
                />

                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      'pendente',
                      'aprovada',
                      'rejeitada',
                    ] as Filter[]
                  ).map(
                    (value) => (
                      <button
                        key={
                          value
                        }
                        type="button"
                        onClick={() =>
                          setFilter(
                            value
                          )
                        }
                        className={`rounded-full border px-2 py-2.5 font-serif text-[10px] ${
                          filter ===
                          value
                            ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
                            : 'border-dourado-200/15 text-creme/40'
                        }`}
                      >
                        {value ===
                        'pendente'
                          ? 'Pendentes'
                          : value ===
                            'aprovada'
                          ? 'Aprovadas'
                          : 'Rejeitadas'}
                      </button>
                    )
                  )}
                </div>

                {loading ? (
                  <Loading />
                ) : reviews.length ===
                  0 ? (
                  <Empty text="Nenhuma avaliação nesta categoria." />
                ) : (
                  <div className="mt-6 flex flex-col gap-4">
                    {reviews.map(
                      (
                        review
                      ) => {
                        const processing =
                          actionId ===
                          review.id;

                        return (
                          <article
                            key={
                              review.id
                            }
                            className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-5"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex gap-1">
                                {[
                                  1,
                                  2,
                                  3,
                                  4,
                                  5,
                                ].map(
                                  (
                                    star
                                  ) => (
                                    <Star
                                      key={
                                        star
                                      }
                                      className={`h-4 w-4 ${
                                        star <=
                                        review.estrelas
                                          ? 'fill-current text-dourado-200'
                                          : 'text-dourado-200/20'
                                      }`}
                                    />
                                  )
                                )}
                              </div>

                              {review.destaque && (
                                <span className="font-serif text-[9px] uppercase text-dourado-200/60">
                                  Destaque
                                  ✦
                                </span>
                              )}
                            </div>

                            <p className="mt-4 font-serif text-[15px] leading-[175%] text-creme/80">
                              {
                                review.comentario
                              }
                            </p>

                            <p className="mt-4 font-serif text-[10px] text-creme/25">
                              {new Date(
                                review.created_at
                              ).toLocaleDateString(
                                'pt-BR'
                              )}
                            </p>

                            <div className="mt-5 border-t border-dourado-200/10 pt-4">
                              {filter ===
                                'pendente' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <ActionButton
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      updateReview(
                                        review.id,
                                        {
                                          status:
                                            'aprovada',
                                        }
                                      )
                                    }
                                  >
                                    <Check className="h-4 w-4" />
                                    Aprovar
                                  </ActionButton>

                                  <ActionButton
                                    disabled={
                                      processing
                                    }
                                    onClick={() =>
                                      updateReview(
                                        review.id,
                                        {
                                          status:
                                            'rejeitada',
                                        }
                                      )
                                    }
                                  >
                                    <XCircle className="h-4 w-4" />
                                    Rejeitar
                                  </ActionButton>
                                </div>
                              )}

                              {filter ===
                                'aprovada' && (
                                <ActionButton
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    updateReview(
                                      review.id,
                                      {
                                        destaque:
                                          !review.destaque,
                                      }
                                    )
                                  }
                                >
                                  {review.destaque
                                    ? 'Remover dos destaques'
                                    : 'Marcar como destaque ✦'}
                                </ActionButton>
                              )}

                              {filter ===
                                'rejeitada' && (
                                <ActionButton
                                  disabled={
                                    processing
                                  }
                                  onClick={() =>
                                    updateReview(
                                      review.id,
                                      {
                                        status:
                                          'aprovada',
                                      }
                                    )
                                  }
                                >
                                  Aprovar
                                  avaliação
                                </ActionButton>
                              )}

                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  deleteReview(
                                    review.id
                                  )
                                }
                                className="mt-2 flex w-full items-center justify-center gap-2 px-4 py-3 font-serif text-xs text-creme/35 disabled:opacity-40"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Excluir
                              </button>
                            </div>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}

            {tab === 'jogos' && (
              <section className="mt-8">
                <SectionTitle
                  title="Jogos"
                  onRefresh={
                    loadServices
                  }
                  loading={
                    loading
                  }
                />

                <button
                  type="button"
                  onClick={
                    openNewService
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dourado-200/35 bg-dourado-200/10 px-4 py-3.5 font-serif text-sm text-dourado-200"
                >
                  <Plus className="h-4 w-4" />
                  Novo jogo
                </button>

                {loading ? (
                  <Loading />
                ) : services.length ===
                  0 ? (
                  <Empty text="Nenhum jogo cadastrado." />
                ) : (
                  <div className="mt-6 flex flex-col gap-4">
                    {services.map(
                      (
                        service
                      ) => {
                        const processing =
                          actionId ===
                          service.id;

                        return (
                          <article
                            key={
                              service.id
                            }
                            className={`rounded-2xl border p-5 ${
                              service.ativo
                                ? 'border-dourado-200/20 bg-bordo-200/45'
                                : 'border-creme/10 bg-bordo-200/20 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-serif text-[9px] uppercase tracking-[0.15em] text-dourado-200/50">
                                  {service.categoria ===
                                  'consulta'
                                    ? 'Consulta'
                                    : `Tiragem • ${formatServiceArea(
                                        service.area
                                      )}`}
                                </p>

                                <h3 className="mt-2 font-serif text-lg text-creme/90">
                                  {
                                    service.nome
                                  }
                                </h3>
                              </div>

                              <span className="whitespace-nowrap font-serif text-lg text-dourado-200">
                                {formatMoney(
                                  service.preco
                                )}
                              </span>
                            </div>

                            <p className="mt-4 font-serif text-sm leading-relaxed text-creme/55">
                              {
                                service.descricao
                              }
                            </p>

                            <p className="mt-4 font-serif text-[10px] text-creme/30">
                              Ordem:{' '}
                              {
                                service.ordem
                              }{' '}
                              •{' '}
                              {service.ativo
                                ? 'Ativo'
                                : 'Desativado'}{' '}
                              {service.destaque
                                ? '• Destaque ✦'
                                : ''}
                            </p>

                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                openEditService(
                                  service
                                )
                              }
                              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-4 py-3 font-serif text-xs text-dourado-200/80 disabled:opacity-40"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              Editar
                            </button>

                            <div className="mt-2 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  toggleService(
                                    service
                                  )
                                }
                                className="rounded-xl border border-dourado-200/15 px-2 py-3 font-serif text-[10px] text-creme/55 disabled:opacity-40"
                              >
                                {service.ativo
                                  ? 'Desativar'
                                  : 'Ativar'}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  processing
                                }
                                onClick={() =>
                                  toggleHighlight(
                                    service
                                  )
                                }
                                className="rounded-xl border border-dourado-200/15 px-2 py-3 font-serif text-[10px] text-dourado-200/65 disabled:opacity-40"
                              >
                                {service.destaque
                                  ? 'Tirar destaque'
                                  : 'Destacar ✦'}
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={
                                processing
                              }
                              onClick={() =>
                                deleteService(
                                  service
                                )
                              }
                              className="mt-2 flex w-full items-center justify-center gap-2 px-4 py-3 font-serif text-[10px] text-creme/30 disabled:opacity-40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Excluir jogo
                            </button>
                          </article>
                        );
                      }
                    )}
                  </div>
                )}
              </section>
            )}

            {tab ===
              'pedidos' && (
              <section className="mt-8">
                <SectionTitle
                  title="Pedidos"
                  onRefresh={
                    loadOrders
                  }
                  loading={
                    loading
                  }
                />

                {loading ? (
                  <Loading />
                ) : orders.length ===
                  0 ? (
                  <Empty text="Nenhum pedido encontrado." />
                ) : (
                  <div className="flex flex-col gap-4">
                    {orders.map(
                      (order) => (
                        <article
                          key={
                            order.id
                          }
                          className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-5"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-serif text-xl text-creme/90">
                              Pedido
                              #{order.id}
                            </h3>

                            <OrderStatus
                              status={
                                order.status
                              }
                              paymentStatus={
                                order.payment_status
                              }
                            />
                          </div>

                          <div className="mt-4 space-y-3">
                            {(
                              order.order_items ??
                              []
                            ).map(
                              (
                                item
                              ) => (
                                <div
                                  key={
                                    item.id
                                  }
                                  className="rounded-xl border border-dourado-200/10 bg-bordo-300/35 p-4"
                                >
                                  <div className="flex justify-between gap-3">
                                    <span className="font-serif text-sm text-creme/85">
                                      {
                                        item.service_name
                                      }
                                    </span>

                                    <span className="font-serif text-xs text-dourado-200/75">
                                      {formatMoney(
                                        item.total_price
                                      )}
                                    </span>
                                  </div>

                                  {item.question && (
                                    <p className="mt-3 border-t border-dourado-200/10 pt-3 font-serif text-xs leading-relaxed text-creme/65">
                                      <span className="text-dourado-200/45">
                                        Pergunta:{' '}
                                      </span>

                                      {
                                        item.question
                                      }
                                    </p>
                                  )}
                                </div>
                              )
                            )}
                          </div>

                          <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-dourado-200/10 bg-bordo-300/25 p-4 font-serif text-xs text-creme/70">
                            <p>
                              Data
                              <br />
                              {formatOrderDate(
                                order.appointment_start_at
                              )}
                            </p>

                            <p>
                              Horário
                              <br />
                              {formatOrderTime(
                                order.appointment_start_at
                              )}
                            </p>

                            <p>
                              Duração
                              <br />
                              {formatDuration(
                                order.duration_minutes
                              )}
                            </p>

                            <p>
                              Total
                              <br />
                              <span className="text-dourado-200">
                                {formatMoney(
                                  order.total
                                )}
                              </span>
                            </p>
                          </div>

                          {order.status !==
                            'cancelado' &&
                            order.payment_status !==
                              'pago' && (
                              <ActionButton
                                disabled={
                                  actionId ===
                                  order.id
                                }
                                onClick={() =>
                                  confirmOrderPayment(
                                    order
                                  )
                                }
                              >
                                <Check className="h-4 w-4" />
                                Confirmar
                                pagamento
                              </ActionButton>
                            )}

                          {order.status !==
                            'cancelado' && (
                            <button
                              type="button"
                              disabled={
                                actionId ===
                                order.id
                              }
                              onClick={() =>
                                cancelOrder(
                                  order
                                )
                              }
                              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-red-300/15 px-4 py-3 font-serif text-xs text-red-300/65 disabled:opacity-40"
                            >
                              <XCircle className="h-4 w-4" />
                              Cancelar pedido
                            </button>
                          )}
                        </article>
                      )
                    )}
                  </div>
                )}
              </section>
            )}

            {tab === 'agenda' && (
              <section className="mt-8">
                <SectionTitle
                  title="Agenda"
                  onRefresh={
                    loadAgenda
                  }
                  loading={
                    loading
                  }
                />

                <div className="rounded-2xl border border-dourado-200/20 bg-bordo-200/45 p-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        changeAgendaDay(
                          -1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-dourado-200/20 text-dourado-200/65"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <input
                      type="date"
                      value={
                        agendaDate
                      }
                      onChange={(
                        event
                      ) =>
                        setAgendaDate(
                          event
                            .target
                            .value
                        )
                      }
                      className="AdminInput flex-1 text-center"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        changeAgendaDay(
                          1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-dourado-200/20 text-dourado-200/65"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-center font-serif text-xs text-creme/45">
                    {formatAgendaDate(
                      agendaDate
                    )}
                  </p>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-dourado-200/20 bg-bordo-200/35">
                  <button
                    type="button"
                    onClick={() =>
                      setShowAvailabilitySettings(
                        (
                          current
                        ) =>
                          !current
                      )
                    }
                    className="flex w-full items-center justify-between p-5 text-left"
                  >
                    <div>
                      <p className="font-serif text-[10px] uppercase tracking-[0.18em] text-dourado-200/50">
                        Horários de
                        atendimento
                      </p>

                      <p className="mt-1 font-serif text-sm text-creme/75">
                        Configurar
                        semana
                      </p>
                    </div>

                    <span className="text-dourado-200/55">
                      {showAvailabilitySettings
                        ? '−'
                        : '+'}
                    </span>
                  </button>

                  {showAvailabilitySettings && (
                    <div className="space-y-3 border-t border-dourado-200/10 p-4">
                      {availabilityDays.map(
                        (
                          day
                        ) => (
                          <div
                            key={
                              day.id
                            }
                            className="rounded-xl border border-dourado-200/10 bg-bordo-300/25 p-3"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="font-serif text-sm text-creme/75">
                                {getWeekdayName(
                                  day.day_of_week
                                )}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateAvailabilityLocal(
                                    day.day_of_week,
                                    {
                                      active:
                                        !day.active,
                                    }
                                  )
                                }
                                className={`rounded-full border px-3 py-1 font-serif text-[10px] ${
                                  day.active
                                    ? 'border-dourado-200/30 text-dourado-200'
                                    : 'border-creme/15 text-creme/35'
                                }`}
                              >
                                {day.active
                                  ? 'Ativo'
                                  : 'Fechado'}
                              </button>
                            </div>

                            {day.active && (
                              <div className="mt-3 grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  value={trimDatabaseTime(
                                    day.start_time
                                  )}
                                  onChange={(
                                    event
                                  ) =>
                                    updateAvailabilityLocal(
                                      day.day_of_week,
                                      {
                                        start_time:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="AdminInput"
                                />

                                <input
                                  type="time"
                                  value={trimDatabaseTime(
                                    day.end_time
                                  )}
                                  onChange={(
                                    event
                                  ) =>
                                    updateAvailabilityLocal(
                                      day.day_of_week,
                                      {
                                        end_time:
                                          event
                                            .target
                                            .value,
                                      }
                                    )
                                  }
                                  className="AdminInput"
                                />
                              </div>
                            )}

                            <button
                              type="button"
                              disabled={
                                savingAvailabilityDay ===
                                day.day_of_week
                              }
                              onClick={() =>
                                saveAvailabilityDay(
                                  day
                                )
                              }
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dourado-200/20 py-2.5 font-serif text-[10px] text-dourado-200/70 disabled:opacity-40"
                            >
                              {savingAvailabilityDay ===
                              day.day_of_week ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Save className="h-3.5 w-3.5" />
                              )}

                              Salvar
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-dourado-200/20 bg-bordo-200/35 p-5">
                  <p className="font-serif text-sm text-creme/80">
                    Bloquear horário
                  </p>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <input
                      type="time"
                      value={
                        agendaStartTime
                      }
                      onChange={(
                        event
                      ) =>
                        setAgendaStartTime(
                          event
                            .target
                            .value
                        )
                      }
                      className="AdminInput"
                    />

                    <input
                      type="time"
                      value={
                        agendaEndTime
                      }
                      onChange={(
                        event
                      ) =>
                        setAgendaEndTime(
                          event
                            .target
                            .value
                        )
                      }
                      className="AdminInput"
                    />
                  </div>

                  <input
                    type="text"
                    value={
                      agendaReason
                    }
                    onChange={(
                      event
                    ) =>
                      setAgendaReason(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Motivo (opcional)"
                    className="AdminInput mt-3"
                  />

                  <button
                    type="button"
                    disabled={
                      savingBlock
                    }
                    onClick={
                      createScheduleBlock
                    }
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dourado-200/30 bg-dourado-200/10 py-3 font-serif text-xs text-dourado-200 disabled:opacity-40"
                  >
                    {savingBlock ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}

                    Bloquear período
                  </button>
                </div>

                {loading ? (
                  <Loading />
                ) : (
                  <div className="mt-5 space-y-3">
                    {appointments.map(
                      (
                        appointment
                      ) => (
                        <div
                          key={`appointment-${appointment.id}`}
                          className="rounded-xl border border-dourado-200/15 bg-bordo-200/35 p-4"
                        >
                          <p className="font-serif text-sm text-creme/80">
                            Atendimento
                            • Pedido #
                            {
                              appointment.order_id
                            }
                          </p>

                          <p className="mt-1 font-serif text-xs text-dourado-200/60">
                            {formatAgendaTime(
                              appointment.start_at
                            )}{' '}
                            –{' '}
                            {formatAgendaTime(
                              appointment.end_at
                            )}{' '}
                            •{' '}
                            {formatDuration(
                              appointment.duration_minutes
                            )}
                          </p>
                        </div>
                      )
                    )}

                    {scheduleBlocks.map(
                      (
                        block
                      ) => (
                        <div
                          key={`block-${block.id}`}
                          className="rounded-xl border border-creme/10 bg-bordo-200/25 p-4"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-serif text-sm text-creme/60">
                                Bloqueado
                                •{' '}
                                {block.reason ||
                                  'Indisponível'}
                              </p>

                              <p className="mt-1 font-serif text-xs text-creme/35">
                                {formatAgendaTime(
                                  block.start_at
                                )}{' '}
                                –{' '}
                                {formatAgendaTime(
                                  block.end_at
                                )}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={
                                actionId ===
                                block.id
                              }
                              onClick={() =>
                                deleteScheduleBlock(
                                  block
                                )
                              }
                              className="p-2 text-creme/35"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )
                    )}

                    {appointments.length ===
                      0 &&
                      scheduleBlocks.length ===
                        0 && (
                        <Empty text="Nenhum compromisso ou bloqueio neste dia." />
                      )}
                  </div>
                )}
              </section>
            )}
          </main>
        </div>
      </div>

      {serviceModalOpen && (
        <div className="fixed inset-0 z-[150] overflow-y-auto bg-black/75 backdrop-blur-sm">
          <div className="flex min-h-full items-end justify-center sm:items-center">
            <div className="relative w-full max-w-[480px] rounded-t-[28px] border border-dourado-200/20 bg-bordo-300 px-5 pb-8 pt-6 sm:rounded-[28px]">
              <button
                type="button"
                onClick={
                  closeServiceModal
                }
                className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-dourado-200/20 text-dourado-200/60"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="text-center">
                <p className="font-serif text-[10px] uppercase tracking-[0.2em] text-dourado-200/45">
                  Painel
                  administrativo
                </p>

                <h2 className="mt-2 font-serif text-xl text-gradient-gold">
                  {editingService
                    ? 'EDITAR JOGO'
                    : 'NOVO JOGO'}
                </h2>
              </div>

              <div className="mt-7 space-y-4">
                <FieldLabel label="Nome do jogo">
                  <input
                    type="text"
                    value={
                      serviceForm.nome
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm(
                        {
                          ...serviceForm,
                          nome:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    placeholder="Ex: Cruz Celta"
                    className="AdminInput"
                  />
                </FieldLabel>

                <div className="grid grid-cols-2 gap-3">
                  <FieldLabel label="Preço (R$)">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={
                        serviceForm.preco
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm(
                          {
                            ...serviceForm,
                            preco:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="AdminInput"
                    />
                  </FieldLabel>

                  <FieldLabel label="Ordem">
                    <input
                      type="number"
                      min="1"
                      value={
                        serviceForm.ordem
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm(
                          {
                            ...serviceForm,
                            ordem:
                              event
                                .target
                                .value,
                          }
                        )
                      }
                      className="AdminInput"
                    />
                  </FieldLabel>
                </div>

                <FieldLabel label="Categoria">
                  <select
                    value={
                      serviceForm.categoria
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm(
                        {
                          ...serviceForm,

                          categoria:
                            event
                              .target
                              .value as
                              | 'consulta'
                              | 'tiragem',

                          area:
                            event
                              .target
                              .value ===
                            'consulta'
                              ? 'geral'
                              : serviceForm.area,
                        }
                      )
                    }
                    className="AdminInput"
                  >
                    <option
                      value="tiragem"
                      className="bg-bordo-300 text-creme"
                    >
                      Tiragem
                    </option>

                    <option
                      value="consulta"
                      className="bg-bordo-300 text-creme"
                    >
                      Consulta
                    </option>
                  </select>
                </FieldLabel>

                {serviceForm.categoria ===
                  'tiragem' && (
                  <FieldLabel label="Área da tiragem">
                    <select
                      value={
                        serviceForm.area
                      }
                      onChange={(
                        event
                      ) =>
                        setServiceForm(
                          {
                            ...serviceForm,

                            area:
                              event
                                .target
                                .value as ServiceArea,
                          }
                        )
                      }
                      className="AdminInput"
                    >
                      {areaOptions.map(
                        (
                          area
                        ) => (
                          <option
                            key={
                              area.value
                            }
                            value={
                              area.value
                            }
                            className="bg-bordo-300 text-creme"
                          >
                            {
                              area.label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </FieldLabel>
                )}

                <FieldLabel label="Descrição">
                  <textarea
                    value={
                      serviceForm.descricao
                    }
                    onChange={(
                      event
                    ) =>
                      setServiceForm(
                        {
                          ...serviceForm,

                          descricao:
                            event
                              .target
                              .value,
                        }
                      )
                    }
                    rows={5}
                    className="AdminInput resize-none py-3"
                  />
                </FieldLabel>

                <ToggleRow
                  label="Jogo ativo"
                  description="Exibir este jogo no site"
                  checked={
                    serviceForm.ativo
                  }
                  onChange={(
                    ativo
                  ) =>
                    setServiceForm(
                      {
                        ...serviceForm,
                        ativo,
                      }
                    )
                  }
                />

                <ToggleRow
                  label="Destacar"
                  description="Marcar como destaque"
                  checked={
                    serviceForm.destaque
                  }
                  onChange={(
                    destaque
                  ) =>
                    setServiceForm(
                      {
                        ...serviceForm,
                        destaque,
                      }
                    )
                  }
                />
              </div>

              {error && (
                <p className="mt-5 text-center font-serif text-xs text-red-300/80">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={
                  saveService
                }
                disabled={
                  savingService
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-dourado-200/45 bg-dourado-200/10 px-5 py-3.5 font-serif text-[11px] uppercase tracking-[0.15em] text-dourado-200 disabled:opacity-40"
              >
                {savingService ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}

                Salvar jogo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border py-3 font-serif text-[10px] ${
        active
          ? 'border-dourado-200/45 bg-dourado-200/10 text-dourado-200'
          : 'border-dourado-200/15 text-creme/40'
      }`}
    >
      <span className="flex items-center justify-center gap-1">
        {icon}
        {children}
      </span>
    </button>
  );
}

function SectionTitle({
  title,
  onRefresh,
  loading,
}: {
  title: string;
  onRefresh: () => void;
  loading: boolean;
}) {
  return (
    <div className="mb-5 flex items-end justify-between">
      <div>
        <p className="font-serif text-[10px] uppercase tracking-[0.22em] text-dourado-200/45">
          Gerenciamento
        </p>

        <h2 className="mt-1 font-serif text-2xl text-creme/90">
          {title}
        </h2>
      </div>

      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-dourado-200/20 text-dourado-200/60 disabled:opacity-40"
      >
        <RefreshCw
          className={`h-4 w-4 ${
            loading
              ? 'animate-spin'
              : ''
          }`}
        />
      </button>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dourado-200/25 bg-dourado-200/5 px-3 py-3 font-serif text-xs text-dourado-200/80 disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-serif text-[10px] uppercase tracking-[0.15em] text-dourado-200/55">
        {label}
      </span>

      {children}
    </label>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (
    checked: boolean
  ) => void;
}) {
  return (
    <button
      type="button"
      onClick={() =>
        onChange(!checked)
      }
      className="flex w-full items-center justify-between gap-4 rounded-xl border border-dourado-200/15 bg-bordo-200/30 px-4 py-4 text-left"
    >
      <div>
        <p className="font-serif text-sm text-creme/80">
          {label}
        </p>

        <p className="mt-1 font-serif text-[10px] text-creme/35">
          {description}
        </p>
      </div>

      <div
        className={`relative h-6 w-11 rounded-full border ${
          checked
            ? 'border-dourado-200/50 bg-dourado-200/20'
            : 'border-creme/15 bg-bordo-300'
        }`}
      >
        <div
          className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full ${
            checked
              ? 'left-6 bg-dourado-200'
              : 'left-1 bg-creme/30'
          }`}
        />
      </div>
    </button>
  );
}

function Loading() {
  return (
    <div className="flex justify-center py-16">
      <Loader2 className="h-6 w-6 animate-spin text-dourado-200/60" />
    </div>
  );
}

function Empty({
  text,
}: {
  text: string;
}) {
  return (
    <div className="py-12 text-center">
      <Clock3 className="mx-auto h-6 w-6 text-dourado-200/30" />

      <p className="mt-3 font-serif text-sm text-creme/45">
        {text}
      </p>
    </div>
  );
}

function Messages({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
      {error && (
        <p className="mt-5 text-center font-serif text-xs text-red-300/80">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-5 text-center font-serif text-xs text-dourado-200/70">
          {success}
        </p>
      )}
    </>
  );
}

function OrderStatus({
  status,
  paymentStatus,
}: {
  status: Order['status'];
  paymentStatus:
    Order['payment_status'];
}) {
  if (
    status === 'cancelado'
  ) {
    return (
      <span className="rounded-full border border-red-300/20 px-3 py-1.5 font-serif text-[9px] uppercase text-red-300/70">
        Cancelado
      </span>
    );
  }

  if (
    paymentStatus === 'pago'
  ) {
    return (
      <span className="rounded-full border border-dourado-200/30 bg-dourado-200/10 px-3 py-1.5 font-serif text-[9px] uppercase text-dourado-200">
        Pago ✓
      </span>
    );
  }

  return (
    <span className="rounded-full border border-dourado-200/15 px-3 py-1.5 font-serif text-[9px] uppercase text-creme/45">
      Aguardando
    </span>
  );
}

function formatServiceArea(
  area: ServiceArea | null
) {
  return (
    areaOptions.find(
      (item) =>
        item.value ===
        (area ?? 'geral')
    )?.label ?? 'Geral'
  );
}

function formatMoney(
  value: number
) {
  return Number(
    value
  ).toLocaleString(
    'pt-BR',
    {
      style: 'currency',
      currency: 'BRL',
    }
  );
}

function getWeekdayName(
  day: number
) {
  return (
    [
      'Domingo',
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
    ][day] ?? 'Dia'
  );
}

function trimDatabaseTime(
  value: string
) {
  return (
    value?.slice(0, 5) ??
    ''
  );
}

function normalizeTimeForDatabase(
  value: string
) {
  return value.length === 5
    ? `${value}:00`
    : value;
}

function getTodayInSaoPaulo() {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }
    ).formatToParts(
      new Date()
    );

  const year =
    parts.find(
      (part) =>
        part.type === 'year'
    )?.value;

  const month =
    parts.find(
      (part) =>
        part.type === 'month'
    )?.value;

  const day =
    parts.find(
      (part) =>
        part.type === 'day'
    )?.value;

  return `${year}-${month}-${day}`;
}

function addDaysToDateString(
  value: string,
  days: number
) {
  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  const date =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    );

  date.setUTCDate(
    date.getUTCDate() +
      days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function saoPauloLocalToIso(
  date: string,
  time: string
) {
  return new Date(
    `${date}T${time}:00-03:00`
  ).toISOString();
}

function getSaoPauloDayRange(
  date: string
) {
  return {
    startIso:
      saoPauloLocalToIso(
        date,
        '00:00'
      ),

    endIso:
      saoPauloLocalToIso(
        addDaysToDateString(
          date,
          1
        ),
        '00:00'
      ),
  };
}

function formatAgendaDate(
  value: string
) {
  const [
    year,
    month,
    day,
  ] = value
    .split('-')
    .map(Number);

  return new Intl.DateTimeFormat(
    'pt-BR',
    {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )
  );
}

function formatAgendaTime(
  value: string
) {
  return new Date(
    value
  ).toLocaleTimeString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatOrderDate(
  value: string | null
) {
  if (!value) return '—';

  return new Date(
    value
  ).toLocaleDateString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',
    }
  );
}

function formatOrderTime(
  value: string | null
) {
  if (!value) return '—';

  return new Date(
    value
  ).toLocaleTimeString(
    'pt-BR',
    {
      timeZone:
        'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function formatDuration(
  minutes: number | null
) {
  if (!minutes) return '—';

  const hours =
    Math.floor(
      minutes / 60
    );

  const rest =
    minutes % 60;

  if (
    hours &&
    rest
  ) {
    return `${hours}h ${rest}min`;
  }

  if (hours) {
    return `${hours}h`;
  }

  return `${rest} min`;
}
